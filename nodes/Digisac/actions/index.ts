import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	INodeProperties,
	INodePropertyOptions,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import {
	DIGISAC_ENDPOINTS,
	type DigisacEndpointDefinition,
	type DigisacHttpMethod,
} from '../generated/endpoints';
import {
	compactDescription,
	fieldName,
	hasUnresolvedPlaceholders,
	parseJsonParameter,
	replaceTemplateValues,
	replaceTemplateVariables,
	safeDecodeURIComponent,
	templateVariables,
	toTitle,
} from '../helpers/format';
import { digisacApiRequest, type DigisacResponseFormat } from '../transport';

type QueryEntry = {
	key: string;
	value: string;
	field: string;
	displayName: string;
	variables: string[];
	isComplex: boolean;
	showField: boolean;
};

type BodyFieldType = 'string' | 'number' | 'boolean' | 'json';

type BodyFieldDefinition = {
	key: string;
	sample: string;
	type: BodyFieldType;
	defaultValue: string | number | boolean;
};

const endpointsById = new Map(DIGISAC_ENDPOINTS.map((endpoint) => [endpoint.id, endpoint]));
const resourceIds = [...new Set(DIGISAC_ENDPOINTS.map((endpoint) => endpoint.resource))];
const queryEntriesByOperation = new Map(
	DIGISAC_ENDPOINTS.map((endpoint) => [endpoint.id, queryEntries(endpoint)]),
);
const bodyFieldsByOperation = new Map(
	DIGISAC_ENDPOINTS.map((endpoint) => [endpoint.id, bodyFields(endpoint)]),
);
const bodyFieldOperationIds = DIGISAC_ENDPOINTS.filter(
	(endpoint) => (bodyFieldsByOperation.get(endpoint.id) ?? []).length > 0,
).map((endpoint) => endpoint.id);
const rawBodyOperationIds = DIGISAC_ENDPOINTS.filter((endpoint) => {
	const fields = bodyFieldsByOperation.get(endpoint.id) ?? [];
	return endpoint.hasBody && fields.length === 0 && endpoint.bodyExample.trim() !== '';
}).map((endpoint) => endpoint.id);

function endpointsForResource(resource: string): DigisacEndpointDefinition[] {
	return DIGISAC_ENDPOINTS.filter((endpoint) => endpoint.resource === resource);
}

export const resourceOptions: INodePropertyOptions[] = resourceIds
	.map((resource) => {
		const first = endpointsForResource(resource)[0];
		return {
			name: first.resourceName,
			value: resource,
			description: `${first.resourceDescription} Includes ${endpointsForResource(resource).length} documented API call(s).`,
		};
	})
	.sort((a, b) => a.name.localeCompare(b.name));

function normalizeQueryTemplate(template: string): string {
	return String(template ?? '').replace(/\?([A-Za-z0-9_$.[\]-]+)=/g, '&$1=');
}

function isComplexQueryValue(value: string): boolean {
	const trimmed = value.trim();
	if (trimmed.startsWith('{{')) return false;
	return trimmed.startsWith('{') || trimmed.startsWith('[') || trimmed.includes('":{"');
}

function simpleQueryKey(key: string): string {
	return key
		.replace(/\[\$[^\]]+\]/g, ' ')
		.replace(/\[(.*?)\]/g, ' $1 ')
		.replace(/\[\]/g, ' ')
		.replace(/[^A-Za-z0-9]+/g, ' ')
		.trim();
}

function isIdentifier(value: string): boolean {
	return /^[A-Za-z_][A-Za-z0-9_]*$/.test(value);
}

function queryDisplayName(key: string, value: string): string {
	const variables = templateVariables(value);
	if (variables.length === 1 && isIdentifier(variables[0])) {
		return toTitle(variables[0]);
	}
	const label = simpleQueryKey(key);
	return label ? toTitle(label) : 'Query Parameter';
}

function shouldShowSimpleQueryField(entry: QueryEntry): boolean {
	if (entry.variables.length > 0) return true;

	const normalizedKey = entry.key.toLowerCase().replace(/[^a-z0-9]/g, '');
	const usefulStaticKeys = new Set([
		'departmentid',
		'departmentparticipation',
		'endperiod',
		'flag',
		'from',
		'grouping',
		'lng',
		'number',
		'page',
		'pdf',
		'periodtype',
		'perpage',
		'serviceid',
		'servicetype',
		'startperiod',
		'status',
		'to',
		'type',
		'userid',
	]);

	return usefulStaticKeys.has(normalizedKey);
}

function queryEntries(endpoint: DigisacEndpointDefinition): QueryEntry[] {
	const template = normalizeQueryTemplate(endpoint.queryTemplate);
	if (!template.trim()) return [];

	return template
		.split('&')
		.filter(Boolean)
		.map((part) => {
			const [rawKey, ...rawValueParts] = part.split('=');
			const key = safeDecodeURIComponent(rawKey ?? '');
			const value = safeDecodeURIComponent(rawValueParts.join('=') ?? '');
			const entry = {
				key,
				value,
				field: fieldName('queryKey', endpoint.id, key),
				displayName: queryDisplayName(key, value),
				variables: [...new Set(templateVariables(value))],
				isComplex: isComplexQueryValue(value),
				showField: false,
			};
			return {
				...entry,
				showField: !entry.isComplex && shouldShowSimpleQueryField(entry),
			};
		});
}

function queryDefault(entry: QueryEntry): string {
	if (entry.variables.length > 0) return '';
	return entry.value;
}

function queryPlaceholder(entry: QueryEntry): string | undefined {
	if (entry.variables.length !== 1) return undefined;
	const variable = entry.variables[0];
	return isIdentifier(variable) ? undefined : variable;
}

function operationDescription(endpoint: DigisacEndpointDefinition): string {
	const entries = queryEntriesByOperation.get(endpoint.id) ?? [];
	const bodyFields = bodyFieldsByOperation.get(endpoint.id) ?? [];
	const parts = [
		`${endpoint.method} ${endpoint.pathTemplate || endpoint.rawUrl}.`,
		`Source: ${endpoint.sourcePath}.`,
	];

	if (endpoint.pathParams.length) {
		parts.push(`Required path parameters: ${endpoint.pathParams.join(', ')}.`);
	}
	if (entries.length) {
		parts.push(
			'Query parameters are exposed as simple fields when useful; documented static filters are applied automatically.',
		);
	}
	if (endpoint.queryParams.length) {
		parts.push(`Documented query placeholders: ${endpoint.queryParams.join(', ')}.`);
	}
	if (endpoint.queryTemplate) {
		parts.push(`Documented query template: ${compactDescription(endpoint.queryTemplate, 260)}.`);
	}
	if (endpoint.hasBody && bodyFields.length) {
		parts.push(
			'Fill Campos do Body first. Use Body JSON Avancado only for payloads that need a custom structure not covered by the generated fields.',
		);
	}
	if (endpoint.hasBody && !bodyFields.length && endpoint.bodyExample.trim()) {
		parts.push('This operation needs Body JSON because the documented payload is an array or a custom object.');
	}
	if (endpoint.absoluteUrlVariable) {
		parts.push('This operation calls the absolute webhook URL supplied in the operation field.');
	}

	return parts.join(' ');
}

function operationProperties(): INodeProperties[] {
	return resourceIds.map((resource) => {
		const endpoints = endpointsForResource(resource);
		return {
			displayName: 'Operation',
			name: 'operation',
			type: 'options',
			noDataExpression: true,
			displayOptions: { show: { resource: [resource] } },
			options: endpoints.map((endpoint) => ({
				name: endpoint.operationName,
				value: endpoint.id,
				action: `${endpoint.method} ${endpoint.operationName}`.slice(0, 128),
				description: operationDescription(endpoint),
			})),
			default: endpoints[0]?.id ?? '',
			description:
				'The exact Digisac API call from the selected Postman folder. Descriptions include method, path, required path variables and query/body guidance for AI Agents.',
		};
	});
}

function pathParameterProperties(): INodeProperties[] {
	return DIGISAC_ENDPOINTS.flatMap((endpoint) =>
		endpoint.pathParams.map((parameter) => ({
			displayName: toTitle(parameter),
			name: fieldName('path', endpoint.id, parameter),
			type: 'string',
			required: true,
			default: '',
			displayOptions: { show: { operation: [endpoint.id] } },
			description: `Required path parameter "{{${parameter}}}" for ${endpoint.method} ${endpoint.pathTemplate}. Use the exact ID/value returned by Digisac; do not invent this value.`,
		})),
	);
}

function queryFieldProperties(): INodeProperties[] {
	const simpleFields: INodeProperties[] = DIGISAC_ENDPOINTS.flatMap((endpoint) =>
		(queryEntriesByOperation.get(endpoint.id) ?? [])
			.filter((entry) => entry.showField)
			.map((entry): INodeProperties => ({
				displayName: entry.displayName,
				name: entry.field,
				type: 'string',
				default: queryDefault(entry),
				placeholder: queryPlaceholder(entry),
				displayOptions: { show: { operation: [endpoint.id] } },
				description: `Optional query parameter "${entry.key}" for ${endpoint.method} ${endpoint.pathTemplate}. Leave empty to omit it. Static defaults come from the Digisac Postman documentation.`,
			})),
	);

	const complexPlaceholderFields: INodeProperties[] = DIGISAC_ENDPOINTS.flatMap((endpoint) => {
		const entries = queryEntriesByOperation.get(endpoint.id) ?? [];
		const variables = [
			...new Set(entries.filter((entry) => entry.isComplex).flatMap((entry) => entry.variables)),
		];

		return variables.map((variable, index): INodeProperties => ({
			displayName: isIdentifier(variable) ? toTitle(variable) : `Query Value ${index + 1}`,
			name: fieldName('query', endpoint.id, variable),
			type: 'string',
			default: '',
			placeholder: isIdentifier(variable) ? undefined : variable,
			displayOptions: { show: { operation: [endpoint.id] } },
			description: `Value used to replace "{{${variable}}}" inside the documented complex query for ${endpoint.method} ${endpoint.pathTemplate}. Leave empty to omit this complex query instead of sending unresolved placeholders.`,
		}));
	});

	return [...simpleFields, ...complexPlaceholderFields];
}

function absoluteUrlProperties(): INodeProperties[] {
	return DIGISAC_ENDPOINTS.filter((endpoint) => endpoint.absoluteUrlVariable).map((endpoint) => ({
		displayName: 'Absolute URL',
		name: fieldName('absoluteUrl', endpoint.id, endpoint.absoluteUrlVariable),
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { operation: [endpoint.id] } },
		description:
			'Full URL to call for this documented operation. Used by the Postman collection for webhook test calls that are outside the normal Digisac Base URL.',
	}));
}

function readQuotedKey(source: string, start: number): { key: string; next: number } | undefined {
	let value = '';
	let escaped = false;
	for (let i = start + 1; i < source.length; i++) {
		const char = source[i];
		if (escaped) {
			value += char;
			escaped = false;
			continue;
		}
		if (char === '\\') {
			escaped = true;
			continue;
		}
		if (char === '"') {
			return { key: value, next: i + 1 };
		}
		value += char;
	}
	return undefined;
}

function scanValue(source: string, start: number): { sample: string; next: number } {
	let depth = 0;
	let inString = false;
	let escaped = false;

	for (let i = start; i < source.length; i++) {
		const char = source[i];
		if (inString) {
			if (escaped) {
				escaped = false;
			} else if (char === '\\') {
				escaped = true;
			} else if (char === '"') {
				inString = false;
			}
			continue;
		}

		if (char === '"') {
			inString = true;
			continue;
		}
		if (char === '{' || char === '[') depth++;
		if (char === '}' || char === ']') {
			if (depth === 0) {
				return { sample: source.slice(start, i).trim(), next: i };
			}
			depth--;
		}
		if (char === ',' && depth === 0) {
			return { sample: source.slice(start, i).trim(), next: i + 1 };
		}
	}

	return { sample: source.slice(start).trim(), next: source.length };
}

function topLevelBodyFields(source: string): Array<{ key: string; sample: string }> {
	const trimmed = source.trim();
	if (!trimmed.startsWith('{')) return [];

	const fields: Array<{ key: string; sample: string }> = [];
	const seen = new Set<string>();
	let depth = 0;
	let inString = false;
	let escaped = false;

	for (let i = 0; i < trimmed.length; i++) {
		const char = trimmed[i];
		if (inString) {
			if (escaped) {
				escaped = false;
			} else if (char === '\\') {
				escaped = true;
			} else if (char === '"') {
				inString = false;
			}
			continue;
		}

		if (char === '"') {
			if (depth === 1) {
				const keyInfo = readQuotedKey(trimmed, i);
				if (!keyInfo) continue;

				let cursor = keyInfo.next;
				while (/\s/.test(trimmed[cursor] ?? '')) cursor++;
				if (trimmed[cursor] !== ':') {
					inString = true;
					continue;
				}

				cursor++;
				while (/\s/.test(trimmed[cursor] ?? '')) cursor++;
				const valueInfo = scanValue(trimmed, cursor);
				if (!seen.has(keyInfo.key)) {
					fields.push({ key: keyInfo.key, sample: valueInfo.sample });
					seen.add(keyInfo.key);
				}
				i = valueInfo.next - 1;
				continue;
			}
			inString = true;
			continue;
		}

		if (char === '{' || char === '[') depth++;
		if (char === '}' || char === ']') depth--;
	}

	return fields;
}

function bodyFieldType(key: string, sample: string): BodyFieldType {
	const trimmed = sample.trim();
	const normalizedKey = key.toLowerCase();

	if (trimmed.startsWith('{') || trimmed.startsWith('[') || trimmed === 'null') return 'json';
	if (/^(true|false)$/i.test(trimmed)) return 'boolean';
	if (/^-?\d+(\.\d+)?$/.test(trimmed)) return 'number';
	if (
		[
			'customfields',
			'data',
			'departments',
			'departmentids',
			'file',
			'files',
			'interactive',
			'interactivemessage',
			'organizationids',
			'parameters',
			'permissions',
			'roles',
			'tagids',
			'ticketselectedid',
			'tickettopicids',
			'where',
		].includes(normalizedKey)
	) {
		return 'json';
	}
	if (
		['count', 'duration', 'maxnum', 'order', 'page', 'perpage', 'time', 'timetoredistribute', 'tries'].some(
			(part) => normalizedKey.includes(part),
		)
	) {
		return 'number';
	}

	return 'string';
}

function literalStringDefault(sample: string): string {
	const match = sample.trim().match(/^"([^"]*)"$/);
	if (!match || match[1].includes('{{')) return '';
	return match[1];
}

function defaultBodyValue(type: BodyFieldType, sample: string): string | number | boolean {
	const trimmed = sample.trim();
	if (type === 'boolean') return /^true$/i.test(trimmed);
	if (type === 'number') return Number(trimmed);
	if (type === 'json') {
		if (trimmed.startsWith('[')) return '[]';
		if (trimmed === 'null') return 'null';
		return '{}';
	}
	return literalStringDefault(trimmed);
}

function bodyFields(endpoint: DigisacEndpointDefinition): BodyFieldDefinition[] {
	if (!endpoint.hasBody || !endpoint.bodyExample.trim()) return [];

	return topLevelBodyFields(endpoint.bodyExample).map(({ key, sample }) => {
		const type = bodyFieldType(key, sample);
		return {
			key,
			sample,
			type,
			defaultValue: defaultBodyValue(type, sample),
		};
	});
}

function bodyFieldsParameter(endpoint: DigisacEndpointDefinition): string {
	return fieldName('bodyFields', endpoint.id, 'fields');
}

function bodyFieldsDefault(fields: BodyFieldDefinition[]): IDataObject {
	return fields.reduce<IDataObject>((defaults, field) => {
		defaults[field.key] = field.defaultValue;
		return defaults;
	}, {});
}

function bodyFieldProperties(): INodeProperties[] {
	return DIGISAC_ENDPOINTS.filter((endpoint) => bodyFieldOperationIds.includes(endpoint.id)).map(
		(endpoint): INodeProperties => {
			const fields = bodyFieldsByOperation.get(endpoint.id) ?? [];
			return {
				displayName: 'Campos do Body',
				name: bodyFieldsParameter(endpoint),
				type: 'collection',
				placeholder: 'Add Field',
				default: bodyFieldsDefault(fields) as INodeProperties['default'],
				displayOptions: { show: { operation: [endpoint.id], useRawBodyJson: [false] } },
				description:
					'Campos gerados a partir do body documentado pela Digisac. Preencha somente os campos necessarios; valores vazios nao sao enviados.',
				options: fields.map((field): INodeProperties => ({
					displayName: toTitle(field.key),
					name: field.key,
					type: field.type,
					default: field.defaultValue,
					description: `Campo "${field.key}" do body para ${endpoint.method} ${endpoint.pathTemplate}. Exemplo da documentacao: ${compactDescription(field.sample, 180)}.`,
				})),
			};
		},
	);
}

function useRawBodyProperties(): INodeProperties[] {
	if (!bodyFieldOperationIds.length) return [];

	return [
		{
			displayName: 'Use Body JSON Avancado',
			name: 'useRawBodyJson',
			type: 'boolean',
			default: false,
			displayOptions: { show: { operation: bodyFieldOperationIds } },
			description:
				'Enable only when the generated Campos do Body are not enough and you need to send a custom JSON object or array.',
		},
	];
}

function rawBodyDefault(endpoint: DigisacEndpointDefinition): string {
	return endpoint.bodyExample.trim().startsWith('[') ? '[]' : '{}';
}

function rawBodyProperties(): INodeProperties[] {
	const rawOnly = DIGISAC_ENDPOINTS.filter((endpoint) => rawBodyOperationIds.includes(endpoint.id)).map(
		(endpoint): INodeProperties => ({
			displayName: 'Body JSON',
			name: fieldName('rawBody', endpoint.id, 'json'),
			type: 'json',
			default: rawBodyDefault(endpoint),
			displayOptions: { show: { operation: [endpoint.id] } },
			description: `JSON enviado no body de ${endpoint.method} ${endpoint.pathTemplate}. A documentacao desta operacao usa array, objeto livre ou instrucao textual, entao nao foi possivel gerar campos simples com seguranca.`,
		}),
	);

	const advanced = DIGISAC_ENDPOINTS.filter((endpoint) => bodyFieldOperationIds.includes(endpoint.id)).map(
		(endpoint): INodeProperties => ({
			displayName: 'Body JSON Avancado',
			name: fieldName('advancedBody', endpoint.id, 'json'),
			type: 'json',
			default: rawBodyDefault(endpoint),
			displayOptions: { show: { operation: [endpoint.id], useRawBodyJson: [true] } },
			description:
				'JSON completo que substitui os Campos do Body desta operacao. Use somente quando precisar enviar uma estrutura customizada.',
		}),
	);

	return [...rawOnly, ...advanced];
}

export const resourceProperties: INodeProperties[] = [
	...operationProperties(),
	...absoluteUrlProperties(),
	...pathParameterProperties(),
	...queryFieldProperties(),
	...useRawBodyProperties(),
	...bodyFieldProperties(),
	...rawBodyProperties(),
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		options: [
			{
				displayName: 'Response Format',
				name: 'responseFormat',
				type: 'options',
				options: [
					{
						name: 'JSON',
						value: 'json',
						description: 'Parse response as JSON. Best for normal Digisac API operations.',
					},
					{
						name: 'Text',
						value: 'text',
						description: 'Return response as text. Useful for CSV/TXT/PDF export endpoints.',
					},
				],
				default: 'json',
				description:
					'How to read the response. Use Text for export endpoints if the response is not JSON.',
			},
			{
				displayName: 'Query Avancada JSON',
				name: 'additionalQueryParameters',
				type: 'json',
				default: '{}',
				description:
					'Advanced escape hatch. Optional JSON object merged into the query string after the generated fields. Use only when the API needs a query parameter that is not represented by a field.',
			},
		],
	},
];

function endpointOrThrow(node: IExecuteFunctions, operation: string): DigisacEndpointDefinition {
	const endpoint = endpointsById.get(operation);
	if (!endpoint) {
		throw new NodeOperationError(node.getNode(), `The Digisac operation "${operation}" is not supported`);
	}
	return endpoint;
}

function collectPathValues(
	node: IExecuteFunctions,
	i: number,
	endpoint: DigisacEndpointDefinition,
): Record<string, string> {
	const values: Record<string, string> = {};
	for (const parameter of endpoint.pathParams) {
		const name = fieldName('path', endpoint.id, parameter);
		const value = node.getNodeParameter(name, i, '') as string;
		if (value !== '') {
			values[parameter] = value;
		}
	}
	return values;
}

function buildEndpointPath(
	node: IExecuteFunctions,
	i: number,
	endpoint: DigisacEndpointDefinition,
): string {
	const values = collectPathValues(node, i, endpoint);
	const path = replaceTemplateVariables(endpoint.pathTemplate, values);

	if (path.includes('{{')) {
		throw new NodeOperationError(
			node.getNode(),
			`Missing required path parameter for ${endpoint.method} ${endpoint.pathTemplate}`,
			{ itemIndex: i },
		);
	}

	return path;
}

function buildSimpleQueryValue(
	node: IExecuteFunctions,
	i: number,
	entry: QueryEntry,
): string | undefined {
	const configuredValue = node.getNodeParameter(entry.field, i, queryDefault(entry)) as string;
	if (configuredValue === '') return undefined;

	if (entry.variables.length === 1) {
		return replaceTemplateValues(entry.value, { [entry.variables[0]]: configuredValue });
	}

	return configuredValue;
}

function buildComplexQueryValue(
	node: IExecuteFunctions,
	i: number,
	endpoint: DigisacEndpointDefinition,
	entry: QueryEntry,
): string | undefined {
	const values: Record<string, string> = {};
	for (const variable of entry.variables) {
		const value = node.getNodeParameter(fieldName('query', endpoint.id, variable), i, '') as string;
		if (value !== '') {
			values[variable] = value;
		}
	}

	const value = replaceTemplateValues(entry.value, values);
	if (hasUnresolvedPlaceholders(value)) return undefined;
	return value;
}

function buildQuery(
	node: IExecuteFunctions,
	i: number,
	endpoint: DigisacEndpointDefinition,
): IDataObject {
	const qs: IDataObject = {};

	for (const entry of queryEntriesByOperation.get(endpoint.id) ?? []) {
		const value = entry.isComplex
			? buildComplexQueryValue(node, i, endpoint, entry)
			: entry.showField
				? buildSimpleQueryValue(node, i, entry)
				: entry.value;

		if (value === undefined || value === '' || hasUnresolvedPlaceholders(value)) {
			continue;
		}
		if (entry.key) {
			qs[entry.key] = value;
		}
	}

	const options = node.getNodeParameter('options', i, {}) as IDataObject;
	const additional = parseJsonParameter(
		options.additionalQueryParameters ?? {},
		'Query Avancada JSON',
		node.getNode(),
	) as IDataObject;

	return { ...qs, ...additional };
}

function shouldUseBodyValue(value: unknown, type: BodyFieldType): boolean {
	if (value === undefined || value === '') return false;
	if (value === null) return type === 'json';
	return true;
}

function normalizeBodyFieldValue(
	node: IExecuteFunctions,
	value: unknown,
	field: BodyFieldDefinition,
): unknown {
	if (field.type !== 'json') return value;
	if (typeof value !== 'string') return value;

	const trimmed = value.trim();
	if (!trimmed) return undefined;

	try {
		return JSON.parse(trimmed);
	} catch (error) {
		throw new NodeOperationError(
			node.getNode(),
			`Campo "${field.key}" must be valid JSON. ${String((error as Error).message)}`,
		);
	}
}

function buildBodyFromFields(
	node: IExecuteFunctions,
	i: number,
	endpoint: DigisacEndpointDefinition,
	fields: BodyFieldDefinition[],
): IDataObject {
	const values = node.getNodeParameter(bodyFieldsParameter(endpoint), i, {}) as IDataObject;
	const body: Record<string, unknown> = {};

	for (const field of fields) {
		const value = values[field.key];
		if (!shouldUseBodyValue(value, field.type)) continue;

		const normalized = normalizeBodyFieldValue(node, value, field);
		if (normalized !== undefined) {
			body[field.key] = normalized;
		}
	}

	return body as IDataObject;
}

function buildBody(
	node: IExecuteFunctions,
	i: number,
	endpoint: DigisacEndpointDefinition,
): IDataObject | IDataObject[] {
	if (!endpoint.hasBody) {
		return {};
	}

	const fields = bodyFieldsByOperation.get(endpoint.id) ?? [];
	if (fields.length) {
		const useRawBody = node.getNodeParameter('useRawBodyJson', i, false) as boolean;
		if (!useRawBody) {
			return buildBodyFromFields(node, i, endpoint, fields);
		}

		return parseJsonParameter(
			node.getNodeParameter(fieldName('advancedBody', endpoint.id, 'json'), i, rawBodyDefault(endpoint)),
			'Body JSON Avancado',
			node.getNode(),
			true,
		);
	}

	if (rawBodyOperationIds.includes(endpoint.id)) {
		return parseJsonParameter(
			node.getNodeParameter(fieldName('rawBody', endpoint.id, 'json'), i, rawBodyDefault(endpoint)),
			'Body JSON',
			node.getNode(),
			true,
		);
	}

	return {};
}

function getAbsoluteUrl(
	node: IExecuteFunctions,
	i: number,
	endpoint: DigisacEndpointDefinition,
): string {
	if (!endpoint.absoluteUrlVariable) {
		return '';
	}
	return node.getNodeParameter(
		fieldName('absoluteUrl', endpoint.id, endpoint.absoluteUrlVariable),
		i,
		'',
	) as string;
}

function normalizeResponse(response: any, responseFormat: DigisacResponseFormat): IDataObject | IDataObject[] {
	if (responseFormat === 'text') {
		return { data: typeof response === 'string' ? response : JSON.stringify(response) };
	}
	return response;
}

export async function executeEndpoint(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<any> {
	const endpoint = endpointOrThrow(this, operation);
	const options = this.getNodeParameter('options', i, {}) as IDataObject;
	const responseFormat = (options.responseFormat as DigisacResponseFormat) ?? 'json';
	const endpointPath = buildEndpointPath(this, i, endpoint);
	const qs = buildQuery(this, i, endpoint);
	const body = buildBody(this, i, endpoint);
	const absoluteUrl = getAbsoluteUrl(this, i, endpoint);

	const response = await digisacApiRequest.call(
		this,
		endpoint.method as IHttpRequestMethods,
		endpointPath,
		body,
		qs,
		{
			baseVariable: endpoint.baseVariable,
			absoluteUrl,
			responseFormat,
		},
	);

	return normalizeResponse(response, responseFormat);
}
