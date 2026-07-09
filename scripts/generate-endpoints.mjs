import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const COLLECTION_URL =
	'https://documenter.gw.postman.com/api/collections/53282970/2sBXihpXmF?segregateAuth=true&versionTag=latest';

const BASE_VARIABLES = new Set(['URL', 'url', 'URLbase', 'link_Completo_Webhook', 'token']);
const SIMPLE_PLACEHOLDER = /^[A-Za-z_][A-Za-z0-9_]*$/;

function ascii(value) {
	return String(value ?? '')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^\x20-\x7E]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

function slug(value) {
	return ascii(value)
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '')
		.slice(0, 80);
}

function rawUrl(request) {
	const url = request?.url;
	if (!url) return '';
	if (typeof url === 'string') return url;
	return url.raw ?? JSON.stringify(url);
}

function cleanRawUrl(value) {
	return ascii(value)
		.replace(/\{\{URL\}\}\}\}/g, '{{URL}}')
		.replace(/\{\{url\}\}/g, '{{URL}}')
		.replace(/\s+/g, '')
		.trim();
}

function detectBase(raw) {
	const match = raw.match(/^\{\{([^}]+)\}\}/);
	if (!match) {
		return { baseVariable: 'URL', absoluteUrlVariable: '', remainder: raw };
	}

	const variable = match[1];
	const remainder = raw.slice(match[0].length);
	if (variable === 'link_Completo_Webhook') {
		return { baseVariable: '', absoluteUrlVariable: variable, remainder: '' };
	}

	return {
		baseVariable: variable === 'URLbase' ? 'URLbase' : 'URL',
		absoluteUrlVariable: '',
		remainder,
	};
}

function normalizePath(value) {
	if (!value) return '';
	let out = value.trim();
	if (out && !out.startsWith('/') && !out.startsWith('http')) {
		out = `/${out}`;
	}
	return out.replace(/\/{2,}/g, '/');
}

function splitUrl(raw) {
	const cleaned = cleanRawUrl(raw);
	const { baseVariable, absoluteUrlVariable, remainder } = detectBase(cleaned);
	const [pathPart = '', queryPart = ''] = remainder.split(/\?(.*)/s);
	return {
		rawUrl: cleaned,
		baseVariable,
		absoluteUrlVariable,
		pathTemplate: normalizePath(pathPart),
		queryTemplate: queryPart,
	};
}

function placeholders(value) {
	const matches = [...String(value ?? '').matchAll(/\{\{([^}]+)\}\}/g)];
	return [
		...new Set(
			matches
				.map((match) => match[1])
				.filter((name) => SIMPLE_PLACEHOLDER.test(name))
				.filter((name) => !BASE_VARIABLES.has(name)),
		),
	];
}

function traverseItems(items, parents = []) {
	const endpoints = [];
	for (const item of items ?? []) {
		if (item.request) {
			endpoints.push({ parents: [...parents, item.name], item });
			continue;
		}
		endpoints.push(...traverseItems(item.item, [...parents, item.name]));
	}
	return endpoints;
}

function bodyExample(request) {
	const raw = request?.body?.raw;
	if (typeof raw !== 'string') return '';
	return ascii(raw).trim();
}

function rootLabel(root) {
	const clean = ascii(root).toLowerCase();
	if (clean.includes('populares')) return 'Popular';
	return 'General';
}

function buildEndpoints(collection) {
	const rawEndpoints = traverseItems(collection.item);
	const endpoints = rawEndpoints.map((entry, index) => {
		const root = rootLabel(entry.parents[0] ?? 'General');
		const group = ascii(entry.parents[1] ?? entry.parents[0] ?? 'API');
		const operationName = ascii(entry.item.name);
		const method = ascii(entry.item.request.method || 'GET').toUpperCase();
		const parsed = splitUrl(rawUrl(entry.item.request));
		const sourcePath = entry.parents.map(ascii).filter(Boolean).join(' > ');
		const resourceId = slug(`${root}_${group}`);
		const id = `e${String(index + 1).padStart(3, '0')}`;

		return {
			id,
			resource: resourceId,
			resourceName: `${group} (${root})`,
			resourceDescription: `${root} endpoints from the Digisac Postman folder "${group}".`,
			operationName,
			originalName: operationName,
			method,
			rawUrl: parsed.rawUrl,
			baseVariable: parsed.baseVariable,
			absoluteUrlVariable: parsed.absoluteUrlVariable,
			pathTemplate: parsed.pathTemplate,
			queryTemplate: parsed.queryTemplate,
			pathParams: placeholders(parsed.pathTemplate),
			queryParams: placeholders(parsed.queryTemplate),
			hasBody:
				bodyExample(entry.item.request).length > 0 ||
				['POST', 'PUT', 'PATCH'].includes(method),
			bodyExample: bodyExample(entry.item.request),
			sourcePath,
		};
	});

	const counts = new Map();
	for (const endpoint of endpoints) {
		const key = `${endpoint.resource}:${endpoint.operationName}`;
		counts.set(key, (counts.get(key) ?? 0) + 1);
	}

	return endpoints.map((endpoint) => {
		const key = `${endpoint.resource}:${endpoint.operationName}`;
		if ((counts.get(key) ?? 0) <= 1) return endpoint;
		const suffix = endpoint.pathTemplate || endpoint.rawUrl || endpoint.id;
		return {
			...endpoint,
			operationName: `${endpoint.operationName} (${endpoint.method} ${suffix})`,
		};
	});
}

async function main() {
	const response = await fetch(COLLECTION_URL);
	if (!response.ok) {
		throw new Error(`Failed to fetch Postman collection: ${response.status} ${response.statusText}`);
	}

	const collection = await response.json();
	const endpoints = buildEndpoints(collection);
	const outputPath = path.resolve('nodes', 'Digisac', 'generated', 'endpoints.ts');

	await mkdir(path.dirname(outputPath), { recursive: true });
	await writeFile(
		outputPath,
		`/* Auto-generated from the public Digisac Postman collection. Do not edit by hand. */\n` +
			`/* Source: ${COLLECTION_URL} */\n\n` +
			`export type DigisacHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';\n\n` +
			`export interface DigisacEndpointDefinition {\n` +
			`\tid: string;\n` +
			`\tresource: string;\n` +
			`\tresourceName: string;\n` +
			`\tresourceDescription: string;\n` +
			`\toperationName: string;\n` +
			`\toriginalName: string;\n` +
			`\tmethod: DigisacHttpMethod;\n` +
			`\trawUrl: string;\n` +
			`\tbaseVariable: 'URL' | 'URLbase' | '';\n` +
			`\tabsoluteUrlVariable: string;\n` +
			`\tpathTemplate: string;\n` +
			`\tqueryTemplate: string;\n` +
			`\tpathParams: string[];\n` +
			`\tqueryParams: string[];\n` +
			`\thasBody: boolean;\n` +
			`\tbodyExample: string;\n` +
			`\tsourcePath: string;\n` +
			`}\n\n` +
			`export const DIGISAC_ENDPOINTS: DigisacEndpointDefinition[] = ${JSON.stringify(
				endpoints,
				null,
				'\t',
			)};\n`,
	);

	console.log(`Generated ${endpoints.length} Digisac endpoints at ${outputPath}`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
