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
 * Formato aceito: data ISO 8601 (`2026-01-31`) com hora e fuso opcionais.
 * Grupos: ano, mês, dia, hora, minuto, segundo, fração, fuso.
 */
const ISO_DATE =
	/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?)?(Z|[+-]\d{2}:?\d{2})?$/;

/**
 * Lê o valor de um campo de data como texto ISO, venha ele como texto, `Date` (expressão `$now`)
 * ou DateTime do Luxon (tem `toISO()`). Outro tipo vira texto vazio.
 */
function dateAsText(raw: unknown): string {
	if (raw instanceof Date) return Number.isNaN(raw.getTime()) ? 'invalid' : raw.toISOString();
	if (typeof raw === 'string') return raw.trim();
	if (
		typeof raw === 'object' &&
		raw !== null &&
		typeof (raw as { toISO?: unknown }).toISO === 'function'
	) {
		return String((raw as { toISO: () => string | null }).toISO() ?? 'invalid');
	}
	return '';
}

/**
 * Converte o valor do seletor de data para ISO em UTC, que é o formato que a coleção usa.
 * Valor vazio volta vazio (o campo é opcional). Texto sem fuso é lido como UTC, para o resultado
 * não depender do fuso do servidor. Valor que não é data (`5`, `2026`, `2026-02-30`) lança erro claro.
 */
export function toIsoDate(
	node: IExecuteFunctions,
	raw: unknown,
	displayName: string,
	itemIndex: number,
): string {
	const text = dateAsText(raw);
	if (text === '') return '';

	const parts = ISO_DATE.exec(text);
	let date: Date | undefined;
	if (parts) {
		const [year, month, day, hour = '0', minute = '0', second = '0', fraction = '0', zone] =
			parts.slice(1);
		const millis = Number(fraction.padEnd(3, '0').slice(0, 3));
		const utc = Date.UTC(+year, +month - 1, +day, +hour, +minute, +second, millis);
		const built = new Date(utc);
		// Dia que "estoura" (30 de fevereiro) volta como outro dia: tratamos como inválido.
		const rolled = built.getUTCMonth() !== +month - 1 || built.getUTCDate() !== +day || +hour > 23;
		if (!rolled) {
			// Fuso explícito desloca o instante; sem fuso fica em UTC.
			const offset = zone && zone !== 'Z' ? offsetMinutes(zone) : 0;
			date = new Date(utc - offset * 60000);
		}
	}
	if (!date || Number.isNaN(date.getTime())) {
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

/** Converte `-03:00` ou `+0530` em minutos de deslocamento em relação ao UTC. */
function offsetMinutes(zone: string): number {
	const sign = zone.startsWith('-') ? -1 : 1;
	const digits = zone.slice(1).replace(':', '');
	return sign * (Number(digits.slice(0, 2)) * 60 + Number(digits.slice(2)));
}

/** Diz se a chave de query é um campo de data guiado na versão 2. */
export function isDateQueryKey(key: string): boolean {
	return DATE_QUERY_KEYS.has(key);
}
