/**
 * Datas e valores fixos guiados da versão 2 do node.
 *
 * Por que existe: na versão 1 a pessoa digita à mão datas (`startPeriod`, `endPeriod`, `from`, `to`)
 * e valores fixos (`status`, `periodType`, `type`, `departmentParticipation`, `userParticipation`,
 * `origin`). A versão 2 mostra seletor de data e lista de opções. O `name` do campo não muda (AD-002);
 * a cópia em texto fica só na versão 1.
 *
 * As alternativas vêm do placeholder da coleção Postman oficial do Digisac, por exemplo
 * `status={{all/open/close}}`. Valores que a documentação não lista (como `grouping`) ficam texto.
 */
import type { IExecuteFunctions, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { toTitle } from './format';
import { FROM_VERSION_2, withVersion } from './versao';

/** Chaves de query que são data e hora (50 campos no catálogo). */
const DATE_QUERY_KEYS = new Set(['startPeriod', 'endPeriod', 'from', 'to']);

/** Chaves de query com alternativas na documentação (16 campos no catálogo). */
const CHOICE_QUERY_KEYS = new Set([
	'status',
	'periodType',
	'type',
	'departmentParticipation',
	'userParticipation',
]);

/** Valores aceitos para `origin` no body de mensagem: o comentário da documentação diz "bot or user". */
const ORIGIN_VALUES = ['bot', 'user'];

/** Opção vazia: mantém o campo opcional, como na versão 1 (padrão vazio, nada vai na requisição). */
const NOT_SET = { name: 'Not Set', value: '' };

/** Monta as opções de uma lista de alternativas, com a opção vazia primeiro. */
function choiceOptions(values: string[]): INodeProperties['options'] {
	return [NOT_SET, ...values.map((value) => ({ name: toTitle(value), value }))];
}

/**
 * Devolve o campo de query pronto para as duas versões.
 * @param property campo de texto gerado para a versão 1.
 * @param key chave da query na documentação (ex.: `startPeriod`).
 * @param choices alternativas do placeholder (ex.: `['all', 'open', 'close']`), ou lista vazia.
 */
export function guideQueryField(
	property: INodeProperties,
	key: string,
	choices: string[],
): INodeProperties[] {
	const isDate = DATE_QUERY_KEYS.has(key);
	const isChoice = CHOICE_QUERY_KEYS.has(key) && choices.length > 0;
	if (!isDate && !isChoice) return [property];

	const legacy: INodeProperties = {
		...property,
		displayOptions: withVersion(property.displayOptions, [1]),
	};
	const guided: INodeProperties = isDate
		? {
				...property,
				type: 'dateTime',
				default: '',
				displayOptions: withVersion(property.displayOptions, FROM_VERSION_2),
			}
		: {
				...property,
				type: 'options',
				default: '',
				options: choiceOptions(choices),
				displayOptions: withVersion(property.displayOptions, FROM_VERSION_2),
			};
	return [legacy, guided];
}

/** Troca um filho de Campos do Body por lista de opções quando a documentação lista os valores. */
export function guideBodyChild(child: INodeProperties): INodeProperties | undefined {
	if (child.name !== 'origin') return undefined;
	return { ...child, type: 'options', options: choiceOptions(ORIGIN_VALUES), default: '' };
}

/**
 * Converte o valor do seletor de data para ISO em UTC, que é o formato que a coleção usa.
 * Valor vazio volta vazio (o campo é opcional). Valor que não é data lança erro claro.
 */
export function toIsoDate(
	node: IExecuteFunctions,
	raw: string,
	displayName: string,
	itemIndex: number,
): string {
	if (raw === '') return raw;
	const date = new Date(raw);
	if (Number.isNaN(date.getTime())) {
		throw new NodeOperationError(
			node.getNode(),
			`The '${displayName}' parameter is not a valid date [item ${itemIndex}]`,
			{
				itemIndex,
				description: 'Pick a date and time, or use an ISO 8601 value like 2026-01-31T23:59:59.000Z',
			},
		);
	}
	return date.toISOString();
}

/** Diz se a chave de query é um campo de data guiado na versão 2. */
export function isDateQueryKey(key: string): boolean {
	return DATE_QUERY_KEYS.has(key);
}
