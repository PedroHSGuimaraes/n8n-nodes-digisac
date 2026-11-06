// Testes do plano rotas-novas — Fatia S3: apagar quadro, coluna e card exige a confirmação ligada.
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

describe('apagar com confirmação', () => {
	const APAGAR = [
		['e303', 'board', 'path_e303_boardId'],
		['e308', 'column', 'path_e308_columnId'],
		['e314', 'card', 'path_e314_cardId'],
	];

	it('K3.01 as três operações de apagar têm o campo Confirm Delete', () => {
		for (const [operacao] of APAGAR) {
			const campos = propriedades.filter(
				(p) => p.name === `confirmDelete_${operacao}` && p.displayName === 'Confirm Delete',
			);
			assert.equal(campos.length, 1, operacao);
			const [campo] = campos;
			assert.equal(campo.type, 'boolean');
			assert.equal(campo.default, false);
			// O lint do n8n exige "Whether" na descrição de todo booleano.
			assert.match(campo.description, /^Whether/);
			assert.deepEqual(campo.displayOptions.show.operation, [operacao]);
			// O aviso fica na descrição da operação, que é o que a pessoa lê ao escolher (padrão do RD Conversas).
			const operacoes = propriedades.find(
				(p) => p.name === 'operation' && p.displayOptions?.show?.resource?.includes('general_kanban'),
			);
			const opcao = operacoes.options.find((o) => o.value === operacao);
			assert.match(opcao.description, /^Warning:/, operacao);
			assert.match(opcao.description, /Confirm Delete/, operacao);
		}
	});

	it('K3.02 sem confirmação cada uma das três recusa antes da requisição', async () => {
		for (const [operacao, substantivo, campo] of APAGAR) {
			// Desligado e ausente (valor padrão do n8n) são o mesmo caso: recusa.
			for (const confirmacao of [{ [`confirmDelete_${operacao}`]: false }, {}]) {
				const contexto = criarContexto(2, { operation: operacao, [campo]: lista('x1'), ...confirmacao });
				await assert.rejects(new Digisac().execute.call(contexto), (erro) => {
					assert.equal(erro.message, `Turn on 'Confirm Delete' to delete this kanban ${substantivo}`);
					return true;
				});
				assert.equal(contexto.requisicoes.length, 0, `${operacao}: não pode haver requisição`);
			}
		}
	});

	it('K3.03 excluir quadro com confirmação envia o DELETE', async () => {
		const { req } = await v2({
			operation: 'e303',
			path_e303_boardId: lista('b1'),
			confirmDelete_e303: true,
		});
		assert.equal(req.method, 'DELETE');
		assert.equal(req.url, '/api/v1/kanban-boards/b1');
	});

	it('K3.04 excluir coluna com confirmação envia a coluna de destino', async () => {
		const { req } = await v2({
			operation: 'e308',
			path_e308_columnId: lista('c1'),
			confirmDelete_e308: true,
			bodyFields_e308_fields: { cardsDestinationColumnId: lista('c2') },
		});
		assert.equal(req.method, 'DELETE');
		assert.equal(req.url, '/api/v1/kanban-columns/c1');
		assert.deepEqual(req.body, { cardsDestinationColumnId: 'c2' });
	});

	it('K3.05 excluir card com confirmação envia o DELETE', async () => {
		const { req } = await v2({
			operation: 'e314',
			path_e314_cardId: lista('k1'),
			confirmDelete_e314: true,
		});
		assert.equal(req.method, 'DELETE');
		assert.equal(req.url, '/api/v1/kanban-cards/k1');
	});

	it('K3.06 as outras DELETE do catálogo não pedem confirmação', async () => {
		const outras = DIGISAC_ENDPOINTS.filter((e) => e.method === 'DELETE' && !IDS_KANBAN.includes(e.id));
		assert.ok(outras.length > 5, 'o catálogo tem várias DELETE antigas');
		for (const endpoint of outras) {
			assert.equal(
				propriedades.filter((p) => p.name === `confirmDelete_${endpoint.id}`).length,
				0,
				endpoint.id,
			);
		}
		// Toda DELETE antiga continua saindo sem confirmação, na versão 1 e na 2.
		for (const antiga of outras) {
			const parametros = { operation: antiga.id };
			for (const p of antiga.pathParams) parametros[`path_${antiga.id}_${p}`] = 'x1';
			for (const versao of [1, 2]) {
				const { req } = await executar(versao, parametros);
				assert.equal(req.method, 'DELETE', `${antiga.id} v${versao}`);
			}
		}
	});
});
