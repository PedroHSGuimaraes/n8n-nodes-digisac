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
		const groupGuidance = first.resourceName.includes('(Popular)')
			? 'Popular = atalho herdado da colecao Postman para operacoes frequentes; prefira para fluxos comuns quando a operacao desejada estiver aqui.'
			: 'General = catalogo mais completo da pasta Postman; use quando precisar de uma operacao que nao aparece em Popular.';
		return {
			name: first.resourceName,
			value: resource,
			description: `Pasta da documentacao Digisac: ${first.resourceName}. ${groupGuidance} Contem ${endpointsForResource(resource).length} chamada(s) documentadas. Escolha este recurso somente quando a tarefa do usuario corresponder a essa area da API.`,
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

function isIdLikeName(value: string): boolean {
	return /(^id$|ids?$)/i.test(String(value ?? '').replace(/[^A-Za-z0-9]/g, ''));
}

function isDateLikeName(value: string): boolean {
	const normalized = String(value ?? '')
		.replace(/[^A-Za-z0-9]/g, '')
		.toLowerCase();
	return (
		['from', 'to', 'start', 'end'].includes(normalized) ||
		/(date|period|createdat|endedat|scheduledat|timestamp)$/.test(normalized) ||
		/(startperiod|endperiod|startedat|closedat|updatedat)/.test(normalized)
	);
}

function enumChoicesFromValue(value: string): string[] {
	const choices = new Set<string>();
	for (const variable of templateVariables(value)) {
		if (!variable.includes('/')) continue;
		for (const choice of variable.split('/')) {
			const cleaned = choice.trim();
			if (cleaned) choices.add(cleaned);
		}
	}
	return [...choices];
}

function querySpecificGuidance(entry: QueryEntry): string {
	const parts: string[] = [];
	const choices = enumChoicesFromValue(entry.value);
	if (choices.length) {
		const enumPlaceholder = templateVariables(entry.value).find((variable) => variable.includes('/'));
		parts.push(
			`A documentacao sugere alternativas: ${choices.join(', ')}. Escolha uma opcao real; nao envie o placeholder literal "${enumPlaceholder}".`,
		);
	}
	if (isIdLikeName(entry.key) || entry.variables.some(isIdLikeName)) {
		parts.push(
			'Se este valor for um ID, use somente ID real retornado pela Digisac ou confirmado pelo usuario; nao invente.',
		);
	}
	if (isDateLikeName(entry.key) || entry.variables.some(isDateLikeName)) {
		parts.push('Para data/hora, use formato ISO-8601 quando a API esperar timestamp.');
	}
	if (/^(where|filters|query|include)/i.test(entry.key)) {
		parts.push('Este campo monta filtro/include da API; preserve a estrutura documentada e altere somente o valor solicitado.');
	}
	return parts.join(' ');
}

function operationRiskGuidance(endpoint: DigisacEndpointDefinition): string {
	if (endpoint.method === 'GET') {
		return 'Operacao de leitura: use para consultar dados. Se precisar de um ID para outra acao, prefira esta operacao antes de escrever dados.';
	}
	if (endpoint.method === 'DELETE') {
		return 'Operacao destrutiva DELETE: use somente quando o usuario pediu explicitamente exclusao/remocao e os IDs foram confirmados.';
	}
	if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
		return 'Operacao de escrita/acao: pode criar, alterar, enviar, transferir, fechar, arquivar ou disparar algo na Digisac. Use somente com intencao clara do usuario e IDs confirmados.';
	}
	return 'Operacao documentada pela Digisac.';
}

function queryEntrySummary(entry: QueryEntry): string {
	const template = entry.value ? ` template "${compactDescription(entry.value, 90)}"` : '';
	return `${entry.displayName} -> ${entry.key}${template}`;
}

function queryGuidance(entries: QueryEntry[]): string {
	if (!entries.length) return '';

	const simple = entries.filter((entry) => entry.showField).map(queryEntrySummary);
	const complex = entries.filter((entry) => entry.isComplex);
	const staticOnly = entries.filter((entry) => !entry.showField && !entry.isComplex);
	const parts: string[] = [];

	if (simple.length) {
		parts.push(`Campos de query disponiveis: ${simple.join('; ')}.`);
	}
	if (complex.length) {
		const variables = [...new Set(complex.flatMap((entry) => entry.variables))];
		parts.push(
			`Query complexa documentada: preencha as variaveis ${variables.join(', ')} quando souber; se faltar uma variavel, essa query complexa e omitida para evitar placeholder falso.`,
		);
	}
	if (staticOnly.length) {
		parts.push(
			`Filtros estaticos da documentacao aplicados automaticamente: ${staticOnly.map((entry) => `${entry.key}=${compactDescription(entry.value, 70)}`).join('; ')}.`,
		);
	}

	return parts.join(' ');
}

function bodyTypeLabel(type: BodyFieldType): string {
	if (type === 'json') return 'JSON valido';
	if (type === 'boolean') return 'booleano';
	if (type === 'number') return 'numero';
	return 'texto';
}

function bodyFieldSpecificGuidance(field: BodyFieldDefinition): string {
	const normalizedKey = field.key.toLowerCase();
	const parts: string[] = [];

	if (isIdLikeName(field.key)) {
		parts.push(
			'ID ou lista de IDs: use somente valores reais da Digisac, vindos de busca/listagem anterior ou confirmados pelo usuario. Nao invente.',
		);
	}
	if (field.type === 'json') {
		parts.push(
			'Informe JSON valido sem comentarios e sem placeholders {{...}}. Para lista use array [...]; para objeto use {...}.',
		);
	}
	if (['file', 'files'].includes(normalizedKey)) {
		parts.push(
			'Para arquivo, use objeto com base64, mimetype e name; em arrays, envie lista desses objetos. Nao coloque o body inteiro dentro deste campo.',
		);
	}
	if (normalizedKey === 'parameters') {
		parts.push(
			'Parametros de template/HSM devem seguir exatamente a estrutura esperada pelo template escolhido; nao invente variaveis ou indices.',
		);
	}
	if (normalizedKey === 'events') {
		parts.push('Eventos devem ser nomes aceitos/configurados pela Digisac para webhook; nao invente eventos.');
	}
	if (normalizedKey === 'where' || normalizedKey === 'query') {
		parts.push('Filtro/query estruturado: altere somente valores conhecidos e preserve a estrutura documentada.');
	}
	if (isDateLikeName(field.key)) {
		parts.push('Para data/hora, use ISO-8601 ou o formato exato que a operacao Digisac documenta.');
	}

	return parts.join(' ');
}

function bodyFieldsSummary(fields: BodyFieldDefinition[]): string {
	if (!fields.length) return '';
	return fields
		.map((field) => `${toTitle(field.key)} (${bodyTypeLabel(field.type)})`)
		.join('; ');
}

function operationDescription(endpoint: DigisacEndpointDefinition): string {
	const entries = queryEntriesByOperation.get(endpoint.id) ?? [];
	const bodyFields = bodyFieldsByOperation.get(endpoint.id) ?? [];
	const parts = [
		`Chamada Digisac documentada: ${endpoint.method} ${endpoint.pathTemplate || endpoint.rawUrl}.`,
		`Use quando a tarefa do usuario corresponder a "${endpoint.operationName}".`,
		'Se houver outra operacao com o mesmo endpoint, escolha pelo nome/efeito da Operation, nao apenas pelo metodo e path.',
		operationRiskGuidance(endpoint),
		`Origem Postman: ${endpoint.sourcePath}.`,
	];

	if (endpoint.pathParams.length) {
		parts.push(
			`Parametros de path obrigatorios: ${endpoint.pathParams.join(', ')}. Use valores reais retornados pela Digisac; nunca invente IDs.`,
		);
	}
	const queryDescription = queryGuidance(entries);
	if (queryDescription) {
		parts.push(queryDescription);
	}
	if (endpoint.hasBody && bodyFields.length) {
		parts.push(
			`Campos do Body gerados: ${bodyFieldsSummary(bodyFields)}. Preencha somente os campos necessarios; campos vazios nao sao enviados. Use Body JSON Avancado somente se essa lista nao cobrir a estrutura necessaria.`,
		);
	}
	if (endpoint.hasBody && !bodyFields.length && endpoint.bodyExample.trim()) {
		parts.push(
			`Esta operacao usa Body JSON porque a documentacao mostra array, objeto livre ou instrucao textual. Use JSON valido e siga a orientacao da documentacao: ${compactDescription(endpoint.bodyExample, 240)}.`,
		);
	}
	if (endpoint.absoluteUrlVariable) {
		parts.push(
			'Esta operacao chama uma URL absoluta de webhook/teste. Use somente URLs confiaveis e diretamente fornecidas pelo usuario ou workflow.',
		);
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
				'Chamada exata da API Digisac. Leia a descricao de cada option antes de escolher: ela informa quando usar, metodo HTTP, endpoint, parametros obrigatorios, query, body e cuidados para nao inventar IDs.',
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
			description: `Parametro obrigatorio "{{${parameter}}}" no path de ${endpoint.method} ${endpoint.pathTemplate}. Use exatamente o ID/valor retornado pela Digisac em uma busca/listagem anterior ou informado pelo usuario. Se nao tiver certeza, busque antes; nao invente.`,
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
				description: `Parametro de query opcional "${entry.key}" para ${endpoint.method} ${endpoint.pathTemplate}. Template documentado: "${compactDescription(entry.value || '(valor livre)', 120)}". Deixe vazio para omitir. ${querySpecificGuidance(entry)} Nao copie placeholders da documentacao; substitua por valor real.`,
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
			description: `Valor que substitui "{{${variable}}}" dentro da query JSON complexa documentada para ${endpoint.method} ${endpoint.pathTemplate}. Preencha somente se tiver o valor real. Se faltar, o node omite a query complexa para nao enviar placeholder inventado. ${enumChoicesFromValue(`{{${variable}}}`).length ? `Escolha uma destas opcoes: ${enumChoicesFromValue(`{{${variable}}}`).join(', ')}; nao envie "${variable}" literal.` : ''}`,
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
			'URL completa chamada por esta operacao documentada, fora da Base URL normal da Digisac. Use somente URL confiavel fornecida pelo usuario, pela propria Digisac ou pelo workflow.',
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
					'Campos gerados a partir do body documentado pela Digisac. Para AI Agents: use estes campos antes de JSON manual; preencha somente dados que o usuario informou ou que vieram de uma busca anterior; valores vazios nao sao enviados.',
				options: fields.map((field): INodeProperties => ({
					displayName: toTitle(field.key),
					name: field.key,
					type: field.type,
					default: field.defaultValue,
					description: `Campo "${field.key}" do body para ${endpoint.method} ${endpoint.pathTemplate}. Tipo esperado: ${bodyTypeLabel(field.type)}. Exemplo da documentacao: ${compactDescription(field.sample, 180)}. ${bodyFieldSpecificGuidance(field)} Deixe vazio para omitir quando nao souber.`,
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
				'Ative somente quando os Campos do Body nao cobrirem a estrutura exigida pela Digisac. Para AI Agents, prefira campos dedicados; JSON avancado substitui todos os Campos do Body.',
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
			description: `JSON enviado no body de ${endpoint.method} ${endpoint.pathTemplate}. A documentacao desta operacao usa array, objeto livre ou instrucao textual, entao nao foi possivel gerar campos simples com seguranca. Use JSON valido, minimo e baseado em dados reais; remova comentarios e substitua qualquer placeholder {{...}} por valor real. Orientacao documentada: ${compactDescription(endpoint.bodyExample, 320)}.`,
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
				'JSON completo que substitui os Campos do Body desta operacao. Use somente quando precisar enviar uma estrutura customizada que os campos dedicados nao suportam. O JSON deve ser valido e conter apenas dados confirmados.',
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
						description: 'Ler resposta como JSON. Use na maioria das chamadas normais da API Digisac.',
					},
					{
						name: 'Text',
						value: 'text',
						description: 'Retornar resposta como texto. Use em exportacoes CSV/TXT/PDF ou quando a resposta nao for JSON.',
					},
				],
				default: 'json',
				description:
					'Formato de leitura da resposta. Para AI Agents: escolha Text apenas em exportacoes ou respostas nao JSON; mantenha JSON nas consultas e escritas comuns.',
			},
			{
				displayName: 'Query Avancada JSON',
				name: 'additionalQueryParameters',
				type: 'json',
				default: '{}',
				description:
					'Objeto JSON opcional mesclado na query string depois dos campos gerados. Chaves iguais substituem os valores dos campos gerados. Use somente quando a Digisac exigir filtro/query sem campo dedicado. Nao use para path nem body; nao use para IDs/datas se houver campo dedicado; nao invente filtros, chaves ou IDs.',
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
