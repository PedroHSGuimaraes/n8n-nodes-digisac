/**
 * IDs guiados da versão 2 do node (Resource Locator).
 *
 * Por que existe: na versão 1 a pessoa digita à mão o ID de contato, conexão, departamento etc.
 * A versão 2 troca esses campos por Resource Locator (lista pesquisável da conta + modo ID),
 * como manda a UX guideline do n8n. O node tem 298 operações geradas, então a troca é feita aqui,
 * em um lugar só, sobre a lista de propriedades que o gerador de `actions/` já monta.
 *
 * Compatibilidade (AD-002): cada campo mantém o MESMO `name`. A cópia em texto fica visível só
 * para `@version` 1 e a cópia Resource Locator só para `@version` 2 ou maior. Workflows salvos
 * guardam typeVersion 1 e continuam lendo texto.
 *
 * Escopo (AD-006 e AD-007): 8 tipos de ID têm lista pesquisável; os outros 24 tipos de ID de path
 * viram Resource Locator só com o modo `id`, para o valor ter o mesmo formato em todo o node.
 */
import type {
	IDisplayOptions,
	IExecuteFunctions,
	INodeProperties,
	INodePropertyOptions,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { toTitle } from './format';
import { guideBodyChild } from './valoresGuiados';
import { FROM_VERSION_2, withVersion } from './versao';

/** Descreve um tipo de ID que tem lista pesquisável. */
interface ListedIdType {
	/** Substantivo em inglês, usado na mensagem de erro ("Choose a contact..."). */
	noun: string;
	/** Nome do método em `methods.listSearch` que alimenta a lista. */
	search: string;
}

/**
 * Os 8 tipos de ID com lista (AD-006). A chave é o nome do parâmetro no catálogo do Digisac.
 * Cada rota de listagem foi confirmada na coleção Postman oficial (ver `methods/listSearch.ts`).
 */
export const LISTED_ID_TYPES: Record<string, ListedIdType> = {
	contactId: { noun: 'contact', search: 'searchContacts' },
	serviceId: { noun: 'service', search: 'searchServices' },
	departmentId: { noun: 'department', search: 'searchDepartments' },
	userId: { noun: 'user', search: 'searchUsers' },
	tagId: { noun: 'tag', search: 'searchTags' },
	roleId: { noun: 'role', search: 'searchRoles' },
	botId: { noun: 'bot', search: 'searchBots' },
	ticketTopicId: { noun: 'ticket topic', search: 'searchTicketTopics' },
};

/** Padrões de nome gerados por `actions/index.ts` (prefixo, id da operação e parâmetro). */
const PATH_NAME = /^path_e\d+_(.+)$/;
/** Filtro de query de ID: `queryKey_e063_where_serviceId_` ou `queryKey_e101_serviceId`. */
const QUERY_ID_NAME = /^queryKey_e\d+_(?:where_)?(contactId|serviceId|departmentId|userId)_?$/;
/** Chaves de ID que o Campos do Body (Body Fields) pode guiar. */
const BODY_ID_KEYS = new Set(['contactId', 'serviceId', 'departmentId', 'userId']);

/** Monta o Resource Locator de um tipo com lista (modos `list` e `id`). */
function listedLocator(
	base: Pick<INodePropertyOptions, 'description'> & { required?: boolean; default?: unknown },
	displayName: string,
	name: string,
	type: ListedIdType,
	displayOptions?: IDisplayOptions,
): INodeProperties {
	// O padrão "all" (departamento e usuário em estatísticas) só existe no modo ID.
	const defaultMode = base.default === 'all' ? 'id' : 'list';
	return {
		displayName,
		name,
		type: 'resourceLocator',
		required: base.required,
		default: { mode: defaultMode, value: base.default === 'all' ? 'all' : '' },
		description: base.description as string,
		...(displayOptions ? { displayOptions } : {}),
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				placeholder: `Select a ${type.noun}...`,
				typeOptions: { searchListMethod: type.search, searchable: true },
			},
			{ displayName: 'By ID', name: 'id', type: 'string', placeholder: 'e.g. 123' },
		],
	};
}

/** Monta o Resource Locator só com o modo `id` (tipos de ID sem lista confirmada). */
function idOnlyLocator(
	base: { required?: boolean; description?: string },
	displayName: string,
	name: string,
	displayOptions?: IDisplayOptions,
): INodeProperties {
	return {
		displayName,
		name,
		type: 'resourceLocator',
		required: base.required,
		default: { mode: 'id', value: '' },
		description: base.description,
		...(displayOptions ? { displayOptions } : {}),
		modes: [{ displayName: 'By ID', name: 'id', type: 'string', placeholder: 'e.g. 123' }],
	};
}

/**
 * Devolve a lista de propriedades pronta para as duas versões do node.
 * Para cada campo de ID guiado sai o par: texto (`@version` 1) + Resource Locator (`@version` 2+).
 * As demais propriedades passam sem mudança e continuam visíveis nas duas versões.
 */
export function withGuidedIds(properties: INodeProperties[]): INodeProperties[] {
	return properties.flatMap((property) => {
		// Campos do Body: a coleção inteira é copiada, com os filhos de ID trocados na cópia da v2.
		if (property.name.startsWith('bodyFields_') && property.type === 'collection') {
			return guideBodyCollection(property);
		}
		if (property.type !== 'string') return [property];

		const pathType = PATH_NAME.exec(property.name)?.[1];
		const queryType = QUERY_ID_NAME.exec(property.name)?.[1];
		const idType = pathType ?? queryType;
		if (!idType) return [property];

		const legacy: INodeProperties = {
			...property,
			displayOptions: withVersion(property.displayOptions, [1]),
		};
		const guidedOptions = withVersion(property.displayOptions, FROM_VERSION_2);
		const listed = LISTED_ID_TYPES[idType];
		if (listed) {
			return [
				legacy,
				listedLocator(property, property.displayName, property.name, listed, guidedOptions),
			];
		}
		// Tipo de ID de path sem lista: só o modo `id` (AD-007). Filtros de query sem lista não entram.
		return pathType
			? [legacy, idOnlyLocator(property, property.displayName, property.name, guidedOptions)]
			: [property];
	});
}

/** Copia uma coleção de Campos do Body e troca os filhos de ID por Resource Locator na cópia v2. */
function guideBodyCollection(collection: INodeProperties): INodeProperties[] {
	const options = (collection.options ?? []) as INodeProperties[];
	// A coleção ganha cópia da versão 2 quando tem algum ID ou o campo origin para guiar.
	if (!options.some((child) => BODY_ID_KEYS.has(child.name) || guideBodyChild(child))) {
		return [collection];
	}

	const guidedChildren = options.map((child) => {
		const valor = guideBodyChild(child);
		if (valor) return valor;
		if (!BODY_ID_KEYS.has(child.name)) return child;
		return listedLocator(
			child,
			child.displayName,
			child.name,
			LISTED_ID_TYPES[child.name],
		) as INodeProperties;
	});
	// O padrão da coleção traz '' em cada ID; na v2 o valor vazio do locator é omitido do body.
	const guidedDefault = Object.fromEntries(
		Object.entries((collection.default ?? {}) as Record<string, unknown>).map(([key, value]) => [
			key,
			BODY_ID_KEYS.has(key) ? { mode: 'list', value: '' } : value,
		]),
	);
	return [
		{ ...collection, displayOptions: withVersion(collection.displayOptions, [1]) },
		{
			...collection,
			options: guidedChildren,
			default: guidedDefault as INodeProperties['default'],
			displayOptions: withVersion(collection.displayOptions, FROM_VERSION_2),
		},
	];
}

/**
 * Normaliza um valor de parâmetro para texto, venha ele como texto (versão 1) ou como
 * Resource Locator `{ mode, value }` (versão 2). Locator vazio vira '' e nunca um objeto.
 * Espaço nas pontas só é cortado no locator: a versão 1 mantém o texto como a 1.0.3 o mandava.
 */
export function plainValue(raw: unknown): string {
	if (typeof raw === 'object' && raw !== null) {
		return String((raw as { value?: unknown }).value ?? '').trim();
	}
	return typeof raw === 'string' ? raw : '';
}

/**
 * Função única de leitura de ID de path: o `execute` passa por aqui para todo parâmetro de path.
 * - Versão 1 (texto): devolve o texto como está.
 * - Versão 2 (locator): devolve `value` sem espaços nas pontas, porque quem cola o ID costuma levar um espaço.
 * - Locator vazio: falha cedo, dizendo o que fazer, em vez de o Digisac devolver 404.
 */
export function getIdParameter(
	node: IExecuteFunctions,
	name: string,
	parameter: string,
	itemIndex: number,
): string {
	const raw = node.getNodeParameter(name, itemIndex, '') as unknown;
	if (typeof raw !== 'object' || raw === null) return typeof raw === 'string' ? raw : '';

	const value = plainValue(raw);
	if (value) return value;

	const listed = LISTED_ID_TYPES[parameter];
	throw new NodeOperationError(
		node.getNode(),
		`The '${toTitle(parameter)}' parameter is empty [item ${itemIndex}]`,
		{
			itemIndex,
			description: listed
				? `Choose a ${listed.noun} from the list or paste its ID`
				: `Paste the ID for ${toTitle(parameter)}`,
		},
	);
}
