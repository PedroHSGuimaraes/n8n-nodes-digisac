/**
 * Regras do recurso Kanban (quadros, colunas e cards) do Digisac.
 *
 * Por que existe: as 17 rotas do Kanban entram no node pelo catálogo gerado, igual às outras 298.
 * Mas elas pedem quatro coisas que o gerador genérico não sabe fazer sozinho, e juntar tudo aqui
 * evita espalhar `if (kanban)` pelo `actions/index.ts`:
 *  1. Apagar quadro, coluna ou card exige o campo `Confirm Delete` ligado (padrão do RD Conversas).
 *  2. Coluna depende de quadro, e card depende de coluna, na hora de montar as listas pesquisáveis.
 *  3. Os campos do body que o gerador tipou mal (booleano que vira JSON, número que vira texto).
 *  4. A query JSON dos três `Listar` precisa sumir com os filtros vazios em vez de sumir inteira.
 *
 * Tudo aqui vale só para o recurso `general_kanban`: as 298 operações antigas ficam como estavam,
 * porque workflow salvo (versão 1 do node) não pode mudar de comportamento.
 */
import type { INodeProperties } from 'n8n-workflow';

import { DIGISAC_ENDPOINTS, type DigisacEndpointDefinition } from '../generated/endpoints';
import { FROM_VERSION_2, withVersion } from './versao';

/** Nome do recurso que o gerador dá à pasta `Gerais > Kanban` da coleção Postman. */
export const KANBAN_RESOURCE = 'general_kanban';

/** Diz se a chamada pertence ao Kanban. */
export function isKanbanEndpoint(endpoint: DigisacEndpointDefinition): boolean {
	return endpoint.resource === KANBAN_RESOURCE;
}

// As 17 chamadas do Kanban, achadas uma vez no carregamento do módulo.
const kanbanEndpoints = DIGISAC_ENDPOINTS.filter(isKanbanEndpoint);
const kanbanOperationIds = new Set(kanbanEndpoints.map((endpoint) => endpoint.id));

/** Diz se o ID de operação (`e300`) é do Kanban; o `resourceLocator.ts` usa para não tocar nas antigas. */
export function isKanbanOperation(operationId: string): boolean {
	return kanbanOperationIds.has(operationId);
}

// ---------------------------------------------------------------------------------------------
// 1. Apagar com confirmação
// ---------------------------------------------------------------------------------------------

/** Substantivo de cada pasta da rota, usado na mensagem e na descrição ("kanban board"). */
const DELETE_NOUNS: Record<string, string> = {
	'kanban-boards': 'board',
	'kanban-columns': 'column',
	'kanban-cards': 'card',
};

/**
 * Devolve `board`, `column` ou `card` quando a chamada apaga algo do Kanban, senão `undefined`.
 * É a única fonte de "esta operação pede confirmação": as outras `DELETE` do catálogo ficam livres.
 */
export function kanbanDeleteNoun(endpoint: DigisacEndpointDefinition): string | undefined {
	if (!isKanbanEndpoint(endpoint) || endpoint.method !== 'DELETE') return undefined;
	const folder = /kanban-(?:boards|columns|cards)/.exec(endpoint.pathTemplate)?.[0];
	return folder ? DELETE_NOUNS[folder] : undefined;
}

/** Nome do parâmetro booleano de confirmação de uma operação de apagar. */
export function confirmDeleteName(operationId: string): string {
	return `confirmDelete_${operationId}`;
}

/** Cria o campo `Confirm Delete` das três operações de apagar do Kanban. */
export function kanbanConfirmProperties(): INodeProperties[] {
	return kanbanEndpoints.flatMap((endpoint): INodeProperties[] => {
		const noun = kanbanDeleteNoun(endpoint);
		if (!noun) return [];
		return [
			{
				displayName: 'Confirm Delete',
				name: confirmDeleteName(endpoint.id),
				type: 'boolean',
				// Desligado por padrão: apagar nunca acontece por esquecimento.
				default: false,
				displayOptions: { show: { operation: [endpoint.id] } },
				// O lint do n8n exige "Whether" no começo da descrição de todo booleano.
				description: `Whether to confirm that the kanban ${noun} is deleted. Without it the operation stops before calling the API.`,
			},
		];
	});
}

/** Texto de aviso que abre a descrição da operação de apagar; vazio para as demais. */
export function kanbanDeleteWarning(endpoint: DigisacEndpointDefinition): string {
	const noun = kanbanDeleteNoun(endpoint);
	if (!noun) return '';
	return `Warning: deletes the kanban ${noun} in Digisac and the deletion cannot be undone. Turn on Confirm Delete to run it. `;
}

// ---------------------------------------------------------------------------------------------
// 2. Campos auxiliares: coluna depende de quadro, card depende de coluna
// ---------------------------------------------------------------------------------------------

// Chaves de body que escolhem uma coluna ou um card. A lista vem dos exemplos de body da coleção.
const COLUMN_BODY_KEYS = ['columnId', 'cardsDestinationColumnId', 'beforeColumnId', 'afterColumnId'];
const CARD_BODY_KEYS = ['beforeCardId', 'afterCardId'];

/** Todas as chaves de body do Kanban que viram Resource Locator na versão 2, além das de contato etc. */
export const KANBAN_BODY_ID_KEYS = ['kanbanBoardId', ...COLUMN_BODY_KEYS, ...CARD_BODY_KEYS];

// Diz se o exemplo de body da coleção traz alguma das chaves (entre aspas, como chave JSON).
function bodyHasKey(endpoint: DigisacEndpointDefinition, keys: string[]): boolean {
	return keys.some((key) => endpoint.bodyExample.includes(`"${key}"`));
}

/** A operação escolhe uma coluna (no path, no body ou na query)? Então a lista de colunas é usada. */
function picksColumn(endpoint: DigisacEndpointDefinition): boolean {
	return (
		isKanbanEndpoint(endpoint) &&
		(endpoint.pathParams.includes('columnId') ||
			bodyHasKey(endpoint, COLUMN_BODY_KEYS) ||
			endpoint.queryTemplate.includes('{{columnId}}'))
	);
}

/** A operação escolhe um card (no path ou no body)? Então a lista de cards é usada. */
function picksCard(endpoint: DigisacEndpointDefinition): boolean {
	return (
		isKanbanEndpoint(endpoint) &&
		(endpoint.pathParams.includes('cardId') || bodyHasKey(endpoint, CARD_BODY_KEYS))
	);
}

/** Nome do campo auxiliar "Filter by Board" de uma operação (só estreita a lista de colunas). */
export function filterBoardName(operationId: string): string {
	return `filterBoard_${operationId}`;
}

/** Nome do campo auxiliar "Filter by Column" de uma operação (só estreita a lista de cards). */
export function filterColumnName(operationId: string): string {
	return `filterColumn_${operationId}`;
}

// Monta um Resource Locator auxiliar de uma operação, visível só da versão 2 em diante.
function helperLocator(
	operationId: string,
	displayName: string,
	name: string,
	noun: string,
	searchListMethod: string,
	description: string,
): INodeProperties {
	return {
		displayName,
		name,
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		description,
		displayOptions: withVersion({ show: { operation: [operationId] } }, FROM_VERSION_2),
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				placeholder: `Select a ${noun}...`,
				typeOptions: { searchListMethod, searchable: true },
			},
			{ displayName: 'By ID', name: 'id', type: 'string', placeholder: 'e.g. 123' },
		],
	};
}

/**
 * Cria os campos auxiliares das operações que escolhem coluna ou card.
 * Eles só estreitam as listas do editor (quadro -> colunas -> cards) e nunca vão na requisição:
 * o Digisac não recebe esses valores, porque nenhuma rota da coleção os pede.
 */
export function kanbanHelperProperties(): INodeProperties[] {
	return kanbanEndpoints.flatMap((endpoint): INodeProperties[] => {
		const needsColumn = picksColumn(endpoint);
		const needsCard = picksCard(endpoint);
		const properties: INodeProperties[] = [];
		// Escolher coluna ou card passa por "qual quadro": o campo estreita a lista de colunas.
		if (needsColumn || needsCard) {
			properties.push(
				helperLocator(
					endpoint.id,
					'Filter by Board',
					filterBoardName(endpoint.id),
					'board',
					'searchKanbanBoards',
					'Only narrows the list of columns to the columns of this board. It is not sent to Digisac. Leave it empty to list the columns of every board',
				),
			);
		}
		// Card não tem lista própria sem coluna: a documentação só filtra cards por `where.columnId`.
		if (needsCard) {
			properties.push(
				helperLocator(
					endpoint.id,
					'Filter by Column',
					filterColumnName(endpoint.id),
					'column',
					'searchKanbanColumns',
					'Only narrows the list of cards to the cards of this column. It is not sent to Digisac. Choose a column to see the cards in the list',
				),
			);
		}
		return properties;
	});
}

// ---------------------------------------------------------------------------------------------
// 3. Campos do body que o gerador tipou mal
// ---------------------------------------------------------------------------------------------

/** Tipo certo e opções de um campo de body do Kanban. */
export interface KanbanBodyOverride {
	type?: 'string' | 'number' | 'boolean' | 'json';
	defaultValue?: string | number | boolean;
	/** Valores aceitos, quando o comentário do body na coleção lista as alternativas. */
	choices?: string[];
}

/**
 * Correções por nome de campo. Valem só para as chamadas do Kanban.
 * - `timeoutAlertEnabled`: a coleção escreve `{{false}}` (placeholder); o gerador leria JSON `{}`.
 * - `position`: a coleção mostra `"1"` entre aspas; posição é número (suposição do plano, Confirmed? n).
 * - `visibleTickets`: o comentário da coleção lista `mine`, `mine-and-not-assigned` e `all`.
 */
const BODY_OVERRIDES: Record<string, KanbanBodyOverride> = {
	timeoutAlertEnabled: { type: 'boolean', defaultValue: false },
	position: { type: 'number', defaultValue: 1 },
	visibleTickets: { choices: ['mine', 'mine-and-not-assigned', 'all'] },
};

/** Devolve a correção do campo, ou `undefined` quando o gerador acertou. */
export function kanbanBodyOverride(
	endpoint: DigisacEndpointDefinition,
	key: string,
): KanbanBodyOverride | undefined {
	return isKanbanEndpoint(endpoint) ? BODY_OVERRIDES[key] : undefined;
}

// ---------------------------------------------------------------------------------------------
// 4. Query JSON sem os filtros vazios
// ---------------------------------------------------------------------------------------------

// Resultado de podar um pedaço do JSON: o valor, se ele fica, e se ele dependia de placeholder.
interface Pruned {
	keep: boolean;
	value?: unknown;
	/** O pedaço tinha algum `{{placeholder}}` dentro dele. */
	hadPlaceholder: boolean;
	/** Algum placeholder dentro dele recebeu valor e ficou. */
	placeholderSurvived: boolean;
}

// Placeholder inteiro de uma string, como "{{columnId}}".
const WHOLE_PLACEHOLDER = /^\{\{([A-Za-z_][A-Za-z0-9_]*)\}\}$/;

// Poda um pedaço do JSON da query. `nested` é falso só na raiz: a raiz nunca some, porque as
// chaves fixas (`paginate`, `withTotal`, `include`) valem mesmo sem nenhum filtro preenchido.
function prune(node: unknown, values: Record<string, string>, nested: boolean): Pruned {
	if (typeof node === 'string') {
		const name = WHOLE_PLACEHOLDER.exec(node)?.[1];
		if (name === undefined) {
			// Texto comum fica; texto com `{{` solto é placeholder mal formado e sai, para não ir ao Digisac.
			return { keep: !node.includes('{{'), value: node, hadPlaceholder: node.includes('{{'), placeholderSurvived: false };
		}
		const given = values[name];
		const filled = given !== undefined && given !== '';
		return { keep: filled, value: given, hadPlaceholder: true, placeholderSurvived: filled };
	}

	if (Array.isArray(node)) {
		const parts = node.map((item) => prune(item, values, true));
		const hadPlaceholder = parts.some((part) => part.hadPlaceholder);
		const placeholderSurvived = parts.some((part) => part.keep && part.placeholderSurvived);
		// Lista cujos valores dependiam de filtro e ficou sem nenhum: some inteira (ex.: `userIds`).
		const keep = !(nested && hadPlaceholder && !placeholderSurvived);
		return {
			keep,
			value: parts.filter((part) => part.keep).map((part) => part.value),
			hadPlaceholder,
			placeholderSurvived,
		};
	}

	if (typeof node === 'object' && node !== null) {
		const entries = Object.entries(node as Record<string, unknown>).map(
			([key, child]) => [key, prune(child, values, true)] as const,
		);
		const hadPlaceholder = entries.some(([, part]) => part.hadPlaceholder);
		const placeholderSurvived = entries.some(([, part]) => part.keep && part.placeholderSurvived);
		// Objeto aninhado cujos filtros ficaram todos vazios some inteiro (ex.: `where`, `customFilter`).
		const keep = !(nested && hadPlaceholder && !placeholderSurvived);
		return {
			keep,
			value: Object.fromEntries(
				entries.filter(([, part]) => part.keep).map(([key, part]) => [key, part.value]),
			),
			hadPlaceholder,
			placeholderSurvived,
		};
	}

	// Número, booleano e null passam como estão.
	return { keep: true, value: node, hadPlaceholder: false, placeholderSurvived: false };
}

/**
 * Monta o texto JSON do parâmetro `query` de um `Listar` do Kanban.
 * O gerador genérico omite a query INTEIRA quando falta um só placeholder; aqui cada filtro vazio
 * sai sozinho e o resto da query (`paginate`, `withTotal`, `include`) continua indo ao Digisac.
 * @param template JSON da coleção com `{{placeholder}}` (ex.: `{"where":{"columnId":"{{columnId}}"}}`).
 * @param values valores preenchidos por nome de placeholder; vazio ou ausente conta como não preenchido.
 */
export function kanbanQueryFromTemplate(template: string, values: Record<string, string>): string {
	const pruned = prune(JSON.parse(template) as unknown, values, false);
	return JSON.stringify(pruned.value);
}
