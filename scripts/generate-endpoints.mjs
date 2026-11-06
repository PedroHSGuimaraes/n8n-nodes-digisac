import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

// Os dois PUT do Kanban (editar coluna e editar card) vêm da coleção como `/v1/kanban-...`, sem
// o `/api` que as outras 15 rotas do Kanban e as outras 295 do node usam. Corrigimos só o prefixo
// `/v1/kanban-`: as três rotas antigas `/v1/cards` (oportunidades do CRM) ficam como a 1.1.0 as
// chama, porque mudar o caminho delas mudaria a versão 1 do node. A suposição do `/api` está
// registrada no plano rotas-novas (Confirmed? n) e precisa de uma chamada real para ser confirmada.
const KANBAN_SEM_API = /^\/v1\/kanban-/;

export function normalizePath(value) {
	if (!value) return '';
	let out = value.trim();
	if (out && !out.startsWith('/') && !out.startsWith('http')) {
		out = `/${out}`;
	}
	out = out.replace(/\/{2,}/g, '/');
	return KANBAN_SEM_API.test(out) ? `/api${out}` : out;
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

export function buildEndpoints(collection) {
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

// Chave que identifica uma rota entre duas gerações do catálogo: método + URL crua + pasta.
function chaveDaRota(endpoint) {
	return `${endpoint.method}|${endpoint.rawUrl}|${endpoint.sourcePath}`;
}

// Numera as rotas pelo catálogo anterior. O gerador antigo dava `e001`, `e002`... por posição na
// coleção, então uma rota nova no meio trocava o ID de todas as seguintes. Workflow salvo guarda o
// ID da operação (ex.: `e063`); se o ID passasse a apontar para outra rota, o workflow chamaria
// outra chamada do Digisac em silêncio. Por isso toda rota já conhecida mantém o ID, e as novas
// recebem os números seguintes ao maior ID existente, na ordem da coleção.
// Rota repetida na coleção (mesma chave) consome um ID antigo por vez, na ordem em que aparecem.
export function reuseIds(endpoints, previous) {
	const idsPorChave = new Map();
	let maior = 0;
	for (const antigo of previous) {
		const lista = idsPorChave.get(chaveDaRota(antigo)) ?? [];
		lista.push(antigo.id);
		idsPorChave.set(chaveDaRota(antigo), lista);
		maior = Math.max(maior, Number(String(antigo.id).replace(/\D/g, '')));
	}

	return endpoints.map((endpoint) => {
		const conhecido = idsPorChave.get(chaveDaRota(endpoint))?.shift();
		if (conhecido) return { ...endpoint, id: conhecido };
		maior += 1;
		return { ...endpoint, id: `e${String(maior).padStart(3, '0')}` };
	});
}

// Lê o `endpoints.ts` versionado e devolve a lista de rotas. Arquivo ausente (primeira geração) ou
// ilegível devolve lista vazia: aí todos os IDs saem na numeração por posição, como antes.
async function readPreviousEndpoints(outputPath) {
	try {
		const source = await readFile(outputPath, 'utf8');
		const start = source.indexOf('= [', source.indexOf('DIGISAC_ENDPOINTS'));
		const end = source.lastIndexOf('];');
		return JSON.parse(source.slice(start + 2, end + 1));
	} catch {
		return [];
	}
}

async function main() {
	const response = await fetch(COLLECTION_URL);
	if (!response.ok) {
		throw new Error(`Failed to fetch Postman collection: ${response.status} ${response.statusText}`);
	}

	const collection = await response.json();
	const outputPath = path.resolve('nodes', 'Digisac', 'generated', 'endpoints.ts');
	// Os IDs antigos vêm do arquivo versionado, para a numeração nova não trocar operação salva.
	const endpoints = reuseIds(buildEndpoints(collection), await readPreviousEndpoints(outputPath));

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

// Só roda o download quando o arquivo é executado direto (`npm run generate:endpoints`); os testes
// importam as funções acima sem disparar a rede.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	main().catch((error) => {
		console.error(error);
		process.exit(1);
	});
}
