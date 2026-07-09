import type { IDataObject, INode } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

const PLACEHOLDER_RE = /\{\{([^}]+)\}\}/g;

export function trimTrailingSlash(value: string): string {
	return String(value ?? '').trim().replace(/\/+$/, '');
}

export function fieldName(prefix: string, endpointId: string, parameter: string): string {
	return `${prefix}_${endpointId}_${parameter.replace(/[^A-Za-z0-9_]/g, '_')}`;
}

export function toTitle(value: string): string {
	return String(value ?? '')
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.replace(/[_-]+/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function parseJsonParameter(
	value: unknown,
	fieldLabel: string,
	node: INode,
	allowArray = false,
): IDataObject | IDataObject[] {
	if (value === undefined || value === null || value === '') {
		return {};
	}
	if (typeof value === 'object') {
		if (Array.isArray(value) && !allowArray) {
			throw new NodeOperationError(node, `${fieldLabel} must be a JSON object, not an array.`);
		}
		return value as IDataObject;
	}
	if (typeof value !== 'string') {
		return {};
	}

	try {
		const parsed = JSON.parse(value);
		if (parsed && typeof parsed === 'object' && (allowArray || !Array.isArray(parsed))) {
			return parsed as IDataObject;
		}
		throw new NodeOperationError(
			node,
			`${fieldLabel} must be a JSON ${allowArray ? 'object or array' : 'object'}, not a primitive value.`,
		);
	} catch (error) {
		throw new NodeOperationError(
			node,
			`${fieldLabel} must be valid JSON. ${String((error as Error).message)}`,
		);
	}
}

export function replaceTemplateVariables(
	template: string,
	values: Record<string, string | number | boolean>,
): string {
	return String(template ?? '').replace(PLACEHOLDER_RE, (match, key: string) => {
		const value = values[key];
		if (value === undefined || value === null || value === '') {
			return match;
		}
		return encodeURIComponent(String(value));
	});
}

export function hasUnresolvedPlaceholders(value: string): boolean {
	return PLACEHOLDER_RE.test(String(value ?? ''));
}

export function queryStringToObject(query: string, skipUnresolved: boolean): IDataObject {
	const out: IDataObject = {};
	const trimmed = String(query ?? '').trim();
	if (!trimmed) return out;

	for (const part of trimmed.split('&')) {
		if (!part) continue;
		const [rawKey, ...rawValueParts] = part.split('=');
		const key = decodeURIComponent(rawKey ?? '');
		const value = decodeURIComponent(rawValueParts.join('=') ?? '');
		if (!key) continue;
		if (skipUnresolved && (hasUnresolvedPlaceholders(key) || hasUnresolvedPlaceholders(value))) {
			continue;
		}
		out[key] = value;
	}

	return out;
}

export function compactDescription(value: string, maxLength = 480): string {
	const normalized = String(value ?? '').replace(/\s+/g, ' ').trim();
	if (normalized.length <= maxLength) {
		return normalized;
	}
	return `${normalized.slice(0, maxLength - 3)}...`;
}
