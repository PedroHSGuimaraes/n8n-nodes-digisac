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
	parseJsonParameter,
	queryStringToObject,
	replaceTemplateVariables,
	toTitle,
} from '../helpers/format';
import { digisacApiRequest, type DigisacResponseFormat } from '../transport';

const endpointsById = new Map(DIGISAC_ENDPOINTS.map((endpoint) => [endpoint.id, endpoint]));
const resourceIds = [...new Set(DIGISAC_ENDPOINTS.map((endpoint) => endpoint.resource))];

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

function operationDescription(endpoint: DigisacEndpointDefinition): string {
	const parts = [
		`${endpoint.method} ${endpoint.pathTemplate || endpoint.rawUrl}.`,
		`Source: ${endpoint.sourcePath}.`,
	];

	if (endpoint.pathParams.length) {
		parts.push(`Required path parameters: ${endpoint.pathParams.join(', ')}.`);
	}
	if (endpoint.queryParams.length) {
		parts.push(`Documented query placeholders: ${endpoint.queryParams.join(', ')}.`);
	}
	if (endpoint.queryTemplate) {
		parts.push(`Documented query template: ${compactDescription(endpoint.queryTemplate, 260)}.`);
	}
	if (endpoint.hasBody) {
		parts.push('Send JSON in Request Body JSON. Use IDs returned by list/get operations; do not invent IDs.');
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

function queryPlaceholderProperties(): INodeProperties[] {
	return DIGISAC_ENDPOINTS.flatMap((endpoint) =>
		endpoint.queryParams.map((parameter) => ({
			displayName: `Query: ${toTitle(parameter)}`,
			name: fieldName('query', endpoint.id, parameter),
			type: 'string',
			default: '',
			displayOptions: { show: { operation: [endpoint.id] } },
			description: `Optional value for documented query placeholder "{{${parameter}}}" in ${endpoint.method} ${endpoint.pathTemplate}. Leave empty and use Additional Query Parameters JSON for complex query objects.`,
		})),
	);
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

const bodyOperationIds = DIGISAC_ENDPOINTS.filter((endpoint) => endpoint.hasBody).map(
	(endpoint) => endpoint.id,
);

export const resourceProperties: INodeProperties[] = [
	...operationProperties(),
	...absoluteUrlProperties(),
	...pathParameterProperties(),
	...queryPlaceholderProperties(),
	{
		displayName: 'Additional Query Parameters JSON',
		name: 'additionalQueryParameters',
		type: 'json',
		default: '{}',
		description:
			'Optional JSON object merged into the query string. Use this for filters such as {"perPage": 40}, nested Digisac query objects as {"query": {"where": {"contactId": "..."}}}, or any documented query not represented by a dedicated field.',
	},
	{
		displayName: 'Request Body JSON',
		name: 'bodyJson',
		type: 'json',
		default: '{}',
		displayOptions: { show: { operation: bodyOperationIds } },
		description:
			'JSON body sent to Digisac for this POST, PUT or PATCH operation. Use field names exactly as Digisac expects. IDs should come from list/get operations, not from guesses.',
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		options: [
			{
				displayName: 'Include Static Query Parameters From Docs',
				name: 'includeDocumentedQuery',
				type: 'boolean',
				default: true,
				description:
					'Whether to include static query parameters already present in the Postman URL, such as perPage=40',
			},
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
				displayName: 'Skip Unresolved Documented Query Placeholders',
				name: 'skipUnresolvedQueryPlaceholders',
				type: 'boolean',
				default: true,
				description:
					'Whether to omit documented query parameters that still contain placeholders like {{serviceId}}. Keep enabled unless you intentionally want to send raw placeholders.',
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

function collectValues(
	node: IExecuteFunctions,
	i: number,
	endpoint: DigisacEndpointDefinition,
	prefix: 'path' | 'query',
	parameters: string[],
): Record<string, string> {
	const values: Record<string, string> = {};
	for (const parameter of parameters) {
		const name = fieldName(prefix, endpoint.id, parameter);
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
	const values = collectValues(node, i, endpoint, 'path', endpoint.pathParams);
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

function buildQuery(
	node: IExecuteFunctions,
	i: number,
	endpoint: DigisacEndpointDefinition,
): IDataObject {
	const options = node.getNodeParameter('options', i, {}) as IDataObject;
	const includeDocumentedQuery = options.includeDocumentedQuery !== false;
	const skipUnresolved = options.skipUnresolvedQueryPlaceholders !== false;
	const queryValues = collectValues(node, i, endpoint, 'query', endpoint.queryParams);
	const documentedQuery = includeDocumentedQuery
		? queryStringToObject(
				replaceTemplateVariables(endpoint.queryTemplate, queryValues),
				Boolean(skipUnresolved),
			)
		: {};
	const additional = parseJsonParameter(
		node.getNodeParameter('additionalQueryParameters', i, '{}'),
		'Additional Query Parameters JSON',
		node.getNode(),
	) as IDataObject;

	return { ...documentedQuery, ...additional };
}

function buildBody(
	node: IExecuteFunctions,
	i: number,
	endpoint: DigisacEndpointDefinition,
): IDataObject | IDataObject[] {
	if (!endpoint.hasBody) {
		return {};
	}
	return parseJsonParameter(
		node.getNodeParameter('bodyJson', i, '{}'),
		'Request Body JSON',
		node.getNode(),
		true,
	);
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
