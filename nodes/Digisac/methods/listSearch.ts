/**
 * `listSearch` dos Resource Locators da versão 2: alimenta a lista pesquisável dos campos de ID.
 *
 * Fonte das rotas: coleção Postman oficial da Digisac (consultada em 06/11/2026). Cada rota abaixo
 * aparece ali como listagem GET com `perPage`. A paginação é `perPage` + `page`.
 *
 * Regras (plano node-cli-campos-v2, S3):
 * - Uma página por chamada (50 itens). O `paginationToken` leva o número da próxima página; o
 *   editor do n8n pede a seguinte só quando a pessoa rola a lista. Nunca baixamos tudo.
 * - Contatos podem ser milhares: o texto vai à API com o operador "contém" (`$iLike` com `%`).
 *   Número usa `where[data.number][$iLike]`, que a coleção documenta. Nome usa
 *   `where[name][$iLike]` (mesmo operador; ainda não visto numa conta real, ver Assumptions do plano).
 * - As outras listas são curtas: a página vem sem filtro e o texto filtra no node, sem acento.
 */
import type {
	IDataObject,
	ILoadOptionsFunctions,
	INodeListSearchItems,
	INodeListSearchResult,
} from 'n8n-workflow';

import { filterBoardName, filterColumnName } from '../helpers/kanban';
import { plainValue } from '../helpers/resourceLocator';
import { digisacApiRequest } from '../transport';

/**
 * Itens por página. A coleção usa `perPage=35` e `40` nos GET simples e 50 só dentro do `query` JSON de
 * `/api/v1/services`; o `page` simples e o filtro `where[name][$iLike]` não aparecem nela. Tudo isto segue
 * como suposição (Assumptions do plano, Confirmed? n): se o Digisac limitar abaixo de 50, a lista para na
 * primeira página.
 */
const PAGE_SIZE = 50;

/** Tira acento e caixa para "tecnico" achar "Técnico". */
function normalize(text: string): string {
	return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/** Texto só de dígitos (e símbolos de telefone) é tratado como número. */
function looksLikePhone(text: string): boolean {
	return /^\+?[\d\s()-]+$/.test(text.trim());
}

/** A API devolve `{ data: [...] }`; se vier um array puro, usa o array (Assumptions do plano). */
function extractItems(response: unknown): IDataObject[] {
	if (Array.isArray(response)) return response as IDataObject[];
	const data = (response as IDataObject | undefined)?.data;
	return Array.isArray(data) ? (data as IDataObject[]) : [];
}

/** Rótulo do item: nome, senão label, senão número do contato, senão o ID. */
function labelOf(item: IDataObject): string {
	const number = (item.data as IDataObject | undefined)?.number;
	return String(item.name ?? item.label ?? number ?? item.id);
}

/** Converte os itens da API em resultados do seletor. */
function toResults(items: IDataObject[]): INodeListSearchItems[] {
	return items.map((item) => ({ name: labelOf(item), value: String(item.id) }));
}

/**
 * Cria o método de busca de uma rota.
 * @param endpoint rota de listagem em `/api/v1/`.
 * @param serverFilter monta o filtro de texto enviado à API; sem ele, o texto filtra no node.
 */
function pagedSearch(endpoint: string, serverFilter?: (text: string) => IDataObject) {
	return async function (
		this: ILoadOptionsFunctions,
		filter?: string,
		paginationToken?: unknown,
	): Promise<INodeListSearchResult> {
		// O token é o número da próxima página; sem token começa na 1.
		const page = Number(paginationToken) || 1;
		const text = (filter ?? '').trim();
		const qs: IDataObject = { perPage: PAGE_SIZE, page };
		if (text && serverFilter) Object.assign(qs, serverFilter(text));

		const response = await digisacApiRequest.call(this, 'GET', endpoint, {}, qs);
		const items = extractItems(response);
		const needle = normalize(text);
		// Sem filtro na API, o node filtra a página recebida pelo rótulo.
		const visible =
			needle && !serverFilter
				? items.filter((item) => normalize(labelOf(item)).includes(needle))
				: items;

		return {
			results: toResults(visible),
			// Página cheia sugere que há mais; página curta é a última (Assumptions do plano).
			...(items.length >= PAGE_SIZE ? { paginationToken: String(page + 1) } : {}),
		};
	};
}

/** Escapa \, % e _ para o ILIKE tratar o texto da pessoa como texto, não como curinga. */
function escapeLike(text: string): string {
	return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * Filtro de contatos: número usa o campo documentado; letras usam o nome.
 * No número, o `+` e a pontuação saem, porque o Digisac guarda só os dígitos.
 */
function contactFilter(text: string): IDataObject {
	return looksLikePhone(text)
		? { 'where[data.number][$iLike]': `%${text.replace(/\D/g, '')}%` }
		: { 'where[name][$iLike]': `%${escapeLike(text)}%` };
}

// ---------------------------------------------------------------------------------------------
// Kanban (plano rotas-novas, S4)
// ---------------------------------------------------------------------------------------------

/**
 * Lê o valor de um campo auxiliar da operação aberta no editor (ex.: `filterBoard_e305`).
 * Devolve texto vazio quando a pessoa ainda não escolheu nada ou quando não há operação aberta.
 */
function helperValue(context: ILoadOptionsFunctions, name: (operationId: string) => string): string {
	const operation = plainValue(context.getCurrentNodeParameter('operation'));
	return operation ? plainValue(context.getCurrentNodeParameter(name(operation))) : '';
}

/** Rótulo do card: a coleção não documenta o nome, então vale o contato do chamado, senão o ID. */
function cardLabel(item: IDataObject): string {
	const contact = (item.ticket as IDataObject | undefined)?.contact as IDataObject | undefined;
	return String(contact?.name ?? item.id);
}

/**
 * Cria o método de busca de uma listagem do Kanban.
 * Essas três listagens da coleção usam o parâmetro `query` em JSON com `paginate:false`: a API
 * devolve tudo numa chamada, então não há `paginationToken` e o texto filtra no node, sem acento.
 * @param endpoint rota de listagem em `/api/v1/`.
 * @param buildQuery monta o JSON da query a partir dos campos auxiliares; `undefined` evita a chamada.
 * @param label rótulo de cada item da lista.
 */
function kanbanSearch(
	endpoint: string,
	buildQuery: (context: ILoadOptionsFunctions) => IDataObject | undefined,
	label: (item: IDataObject) => string = labelOf,
) {
	return async function (this: ILoadOptionsFunctions, filter?: string): Promise<INodeListSearchResult> {
		const query = buildQuery(this);
		// Sem o filtro obrigatório (card sem coluna) a lista fica vazia e a API nem é chamada.
		if (!query) return { results: [] };

		const response = await digisacApiRequest.call(this, 'GET', endpoint, {}, {
			query: JSON.stringify(query),
		});
		const needle = normalize(filter ?? '');
		const items = extractItems(response).filter(
			(item) => !needle || normalize(label(item)).includes(needle),
		);
		return { results: items.map((item) => ({ name: label(item), value: String(item.id) })) };
	};
}

export const listSearch = {
	// Quadros: lista fixa da documentação, sem filtro por quadro.
	searchKanbanBoards: kanbanSearch('/api/v1/kanban-boards', () => ({
		paginate: false,
		withTotal: false,
	})),
	// Colunas: estreitadas pelo quadro do campo auxiliar; sem quadro, lista as colunas de todos.
	searchKanbanColumns: kanbanSearch('/api/v1/kanban-columns', (context) => {
		const board = helperValue(context, filterBoardName);
		return {
			paginate: false,
			withTotal: false,
			...(board ? { where: { kanbanBoardId: board } } : {}),
		};
	}),
	// Cards: a documentação só filtra por coluna, então sem coluna escolhida a lista fica vazia.
	searchKanbanCards: kanbanSearch(
		'/api/v1/kanban-cards',
		(context) => {
			const column = helperValue(context, filterColumnName);
			return column
				? { where: { columnId: column }, paginate: false, withTotal: false }
				: undefined;
		},
		cardLabel,
	),
	searchContacts: pagedSearch('/api/v1/contacts', contactFilter),
	searchServices: pagedSearch('/api/v1/services'),
	searchDepartments: pagedSearch('/api/v1/departments'),
	searchUsers: pagedSearch('/api/v1/users'),
	searchTags: pagedSearch('/api/v1/tags'),
	searchRoles: pagedSearch('/api/v1/roles'),
	searchBots: pagedSearch('/api/v1/bots'),
	searchTicketTopics: pagedSearch('/api/v1/ticket-topics'),
};
