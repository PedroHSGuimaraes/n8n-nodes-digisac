import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { substituirBloco } from './readme-bloco.mjs';

const ENDPOINTS_FILE = path.resolve('nodes', 'Digisac', 'generated', 'endpoints.ts');
const README_FILE = path.resolve('README.md');
const API_DOC_FILE = path.resolve('docs', 'api-calls.md');

function escapeCell(value) {
	return String(value ?? '')
		.replace(/\r?\n/g, ' ')
		.replace(/\|/g, '\\|')
		.replace(/\s+/g, ' ')
		.trim();
}

async function loadEndpoints() {
	const source = await readFile(ENDPOINTS_FILE, 'utf8');
	const match = source.match(/export const DIGISAC_ENDPOINTS: DigisacEndpointDefinition\[] = ([\s\S]*);\n?$/);
	if (!match) {
		throw new Error(`Could not find DIGISAC_ENDPOINTS in ${ENDPOINTS_FILE}`);
	}
	return JSON.parse(match[1]);
}

function groupEndpoints(endpoints) {
	const groups = new Map();
	for (const endpoint of endpoints) {
		const key = endpoint.resourceName;
		if (!groups.has(key)) groups.set(key, []);
		groups.get(key).push(endpoint);
	}
	return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function methodSummary(endpoints) {
	const counts = new Map();
	for (const endpoint of endpoints) {
		counts.set(endpoint.method, (counts.get(endpoint.method) ?? 0) + 1);
	}
	return ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
		.map((method) => `${method}: ${counts.get(method) ?? 0}`)
		.join(' | ');
}

function operationRows(endpoints) {
	return endpoints
		.map((endpoint) => {
			const params = [
				...endpoint.pathParams.map((param) => `path:${param}`),
				...endpoint.queryParams.map((param) => `query:${param}`),
			].join(', ');
			return `| \`${endpoint.id}\` | \`${endpoint.method}\` | \`${escapeCell(endpoint.pathTemplate || endpoint.rawUrl)}\` | ${escapeCell(endpoint.operationName)} | ${escapeCell(params || '-')} |`;
		})
		.join('\n');
}

function groupSummaryRows(groups) {
	return groups
		.map(([name, endpoints]) => `| ${escapeCell(name)} | ${endpoints.length} |`)
		.join('\n');
}

function apiDoc(endpoints, groups) {
	const sections = groups
		.map(
			([name, items]) => `## ${name}

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
${operationRows(items)}
`,
		)
		.join('\n');

	return `# Catálogo completo de chamadas Digisac

Este arquivo é gerado a partir da coleção pública Postman da Digisac e lista todas as chamadas incluídas no node n8n.

Fonte da API:

\`\`\`text
https://documenter.getpostman.com/view/53282970/2sBXihpXmF
\`\`\`

Resumo:

- Total de chamadas documentadas: ${endpoints.length}
- Total de recursos/pastas no node: ${groups.length}
- Métodos: ${methodSummary(endpoints)}

## Como ler esta tabela

- **ID** é o identificador interno da operação no node. Ele aparece apenas no código gerado; na interface do n8n o usuário escolhe pelo nome da operação.
- **Método** é o verbo HTTP usado pela API.
- **Caminho** é o endpoint chamado após a Base URL configurada na credencial.
- **Operação** é o nome herdado da documentação Postman.
- **Parâmetros detectados** mostra placeholders encontrados em path e query. IDs devem vir de operações de listagem/busca, nunca de valores inventados.

## Resumo por recurso

| Recurso | Chamadas |
| --- | ---: |
${groupSummaryRows(groups)}

${sections}`;
}

async function main() {
	const endpoints = await loadEndpoints();
	const groups = groupEndpoints(endpoints);

	await mkdir(path.dirname(API_DOC_FILE), { recursive: true });
	// O README é escrito à mão (AD-009): o gerador troca só a tabela de recursos entre os marcadores.
	const tabela = `| Recurso | Chamadas |\n| --- | ---: |\n${groupSummaryRows(groups)}`;
	await writeFile(README_FILE, substituirBloco(await readFile(README_FILE, 'utf8'), tabela));
	await writeFile(API_DOC_FILE, apiDoc(endpoints, groups));

	console.log(`Updated the README resource table and docs/api-calls.md for ${endpoints.length} endpoints.`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
