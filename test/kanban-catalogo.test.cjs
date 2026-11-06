// Testes do plano rotas-novas — Fatia S1: o catálogo gerado traz as 17 rotas e mantém os IDs antigos.
// Cada teste nasce de um critério de `.specs/features/rotas-novas/plan.md`. Se um quebra, o node
// mandou ao Digisac uma requisição diferente da documentada, ou um workflow salvo passou a chamar
// outra operação (ID trocado), ou apagar deixou de pedir confirmação.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { describe, it } = require('node:test');

const { Digisac } = require('../dist/nodes/Digisac/Digisac.node');
const { DIGISAC_ENDPOINTS } = require('../dist/nodes/Digisac/generated/endpoints');
const { criarContexto } = require('./contexto.cjs');
const idsAntigos = require('./fixtures/ids-1.1.0.json');

const raiz = path.resolve(__dirname, '..');
const propriedades = new Digisac().description.properties;
const listSearch = new Digisac().methods?.listSearch;

// As 17 chamadas do Kanban na ordem da coleção: id esperado, método, caminho e nome.
const KANBAN = [
	['e299', 'GET', '/api/v1/kanban-boards', 'Listar quadros'],
	['e300', 'GET', '/api/v1/kanban-boards/{{boardId}}', 'Buscar quadro'],
	['e301', 'POST', '/api/v1/kanban-boards', 'Criar quadro'],
	['e302', 'PUT', '/api/v1/kanban-boards/{{boardId}}', 'Editar quadro'],
	['e303', 'DELETE', '/api/v1/kanban-boards/{{boardId}}', 'Excluir quadro'],
	['e304', 'GET', '/api/v1/kanban-columns', 'Listar colunas'],
	['e305', 'GET', '/api/v1/kanban-columns/{{columnId}}', 'Buscar coluna'],
	['e306', 'POST', '/api/v1/kanban-columns', 'Criar coluna'],
	['e307', 'PUT', '/api/v1/kanban-columns/{{columnId}}', 'Editar coluna'],
	['e308', 'DELETE', '/api/v1/kanban-columns/{{columnId}}', 'Excluir coluna'],
	['e309', 'PATCH', '/api/v1/kanban-columns/{{columnId}}/reorder', 'Reordenar coluna'],
	['e310', 'GET', '/api/v1/kanban-cards', 'Listar cards'],
	['e311', 'GET', '/api/v1/kanban-cards/{{cardId}}', 'Buscar card'],
	['e312', 'POST', '/api/v1/kanban-cards', 'Criar card'],
	['e313', 'PUT', '/api/v1/kanban-cards/{{cardId}}', 'Editar card'],
	['e314', 'DELETE', '/api/v1/kanban-cards/{{cardId}}', 'Excluir card'],
	['e315', 'PATCH', '/api/v1/kanban-cards/{{cardId}}/reorder', 'Reordenar card'],
];
const IDS_KANBAN = KANBAN.map(([id]) => id);

// Roda o execute do node com o contexto falso e devolve a requisição gravada.
async function executar(versao, parametros, respondedor) {
	const contexto = criarContexto(versao, parametros, respondedor);
	const saida = await new Digisac().execute.call(contexto);
	return { contexto, saida, req: contexto.requisicoes[0] };
}
// Atalho da versão 2 (a que usa Resource Locator).
const v2 = (parametros, respondedor) => executar(2, parametros, respondedor);
// Locator no modo lista, como o editor do n8n grava.
const lista = (value) => ({ mode: 'list', value });

// Diz se a propriedade aparece na versão pedida.
function visivelNa(propriedade, versao) {
	const condicao = propriedade.displayOptions?.show?.['@version'];
	if (condicao === undefined) return true;
	return condicao.some(
		(c) =>
			c === versao ||
			(typeof c === 'object' && c._cnd?.gte !== undefined && c._cnd.gte <= versao),
	);
}
// Procura a cópia de um parâmetro visível numa versão, pelo nome.
const copia = (nome, versao) => propriedades.filter((p) => p.name === nome && visivelNa(p, versao));

describe('catálogo do Kanban', () => {
	it('K1.01 os 298 IDs antigos continuam iguais', () => {
		const atual = new Map(DIGISAC_ENDPOINTS.map((e) => [e.id, e]));
		assert.equal(idsAntigos.length, 298);
		for (const antigo of idsAntigos) {
			const novo = atual.get(antigo.id);
			assert.ok(novo, `${antigo.id} sumiu do catálogo`);
			assert.equal(novo.method, antigo.method, antigo.id);
			assert.equal(novo.rawUrl, antigo.rawUrl, antigo.id);
		}
		assert.equal(DIGISAC_ENDPOINTS.length, 315);
	});

	it('K1.02 os IDs novos vão de e299 a e315 na ordem da coleção', () => {
		const antigos = new Set(idsAntigos.map((e) => e.id));
		const novos = DIGISAC_ENDPOINTS.filter((e) => !antigos.has(e.id)).map((e) => e.id);
		assert.deepEqual(novos, IDS_KANBAN);
	});

	it('K1.03 reuseIds reaproveita o ID conhecido e numera a rota nova pelo maior ID', async () => {
		const { reuseIds } = await import(pathToFileURL(path.join(raiz, 'scripts/generate-endpoints.mjs')));
		const chave = (n) => ({ method: 'GET', rawUrl: `{{URL}}/api/v1/${n}`, sourcePath: `Gerais > ${n}` });
		// Catálogo antigo: ids fora de ordem e um id grande, para provar que o maior vence.
		const anterior = [
			{ id: 'e030', ...chave('c') },
			{ id: 'e010', ...chave('a') },
			{ id: 'e020', ...chave('b') },
		];
		// Coleção nova: ordem diferente e duas rotas novas no meio.
		const colecao = [chave('a'), chave('x'), chave('b'), chave('c'), chave('y')].map((e, i) => ({
			id: `e${String(i + 1).padStart(3, '0')}`,
			...e,
		}));
		const ids = reuseIds(colecao, anterior).map((e) => e.id);
		assert.deepEqual(ids, ['e010', 'e031', 'e020', 'e030', 'e032']);
		// Rota repetida na coleção (mesma chave) consome um ID antigo por vez, na ordem.
		const dupla = reuseIds(
			[
				{ id: 'e001', ...chave('d') },
				{ id: 'e002', ...chave('d') },
			],
			[
				{ id: 'e005', ...chave('d') },
				{ id: 'e006', ...chave('d') },
			],
		).map((e) => e.id);
		assert.deepEqual(dupla, ['e005', 'e006']);
	});

	it('K1.04 as 17 rotas do Kanban têm método e caminho da documentação', () => {
		const kanban = DIGISAC_ENDPOINTS.filter((e) => e.resource === 'general_kanban');
		assert.deepEqual(
			kanban.map((e) => [e.id, e.method, e.pathTemplate, e.operationName]),
			KANBAN,
		);
	});

	it('K1.05 o gerador põe /api nos PUT do Kanban e não mexe em /v1/cards', async () => {
		const { normalizePath } = await import(pathToFileURL(path.join(raiz, 'scripts/generate-endpoints.mjs')));
		assert.equal(normalizePath('/v1/kanban-columns/{{columnId}}'), '/api/v1/kanban-columns/{{columnId}}');
		assert.equal(normalizePath('/v1/kanban-cards/{{cardId}}'), '/api/v1/kanban-cards/{{cardId}}');
		// Oportunidades do CRM são outra API: a 1.1.0 as chama sem /api.
		assert.equal(normalizePath('/v1/cards'), '/v1/cards');
		assert.equal(normalizePath('/v1/cards/{{cardsId}}'), '/v1/cards/{{cardsId}}');
		assert.equal(normalizePath('/api/v1/kanban-boards'), '/api/v1/kanban-boards');
	});

	it('K1.06 o build não chama o gerador', () => {
		const pacote = JSON.parse(fs.readFileSync(path.join(raiz, 'package.json'), 'utf8'));
		assert.equal(pacote.scripts.build, 'n8n-node build');
		assert.doesNotMatch(pacote.scripts.build, /generate/);
	});
});
