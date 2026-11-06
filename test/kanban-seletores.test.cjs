// Testes do plano rotas-novas — Fatia S4: quadro, coluna e card como lista pesquisável na versão 2.
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

describe('seletores do Kanban', () => {
	// Os 12 tipos guiados: onde aparecem e qual método de busca cada um usa.
	const TIPOS = [
		['path_e300_boardId', 'searchKanbanBoards'],
		['path_e305_columnId', 'searchKanbanColumns'],
		['path_e311_cardId', 'searchKanbanCards'],
		['query_e304_boardId', 'searchKanbanBoards'],
		['query_e310_columnId', 'searchKanbanColumns'],
		['bodyFields_e306_fields.kanbanBoardId', 'searchKanbanBoards'],
		['bodyFields_e312_fields.columnId', 'searchKanbanColumns'],
		['bodyFields_e308_fields.cardsDestinationColumnId', 'searchKanbanColumns'],
		['bodyFields_e309_fields.beforeColumnId', 'searchKanbanColumns'],
		['bodyFields_e309_fields.afterColumnId', 'searchKanbanColumns'],
		['bodyFields_e315_fields.beforeCardId', 'searchKanbanCards'],
		['bodyFields_e315_fields.afterCardId', 'searchKanbanCards'],
	];

	it('K4.01 quadro, coluna e card viram resourceLocator na versão 2', () => {
		assert.equal(TIPOS.length, 12);
		for (const [alvo, metodo] of TIPOS) {
			const [nome, filho] = alvo.split('.');
			const [base] = copia(nome, 2);
			assert.ok(base, `${nome} não existe na v2`);
			const campo = filho ? base.options.find((o) => o.name === filho) : base;
			assert.ok(campo, alvo);
			assert.equal(campo.type, 'resourceLocator', alvo);
			assert.deepEqual(campo.modes.map((m) => m.name), ['list', 'id'], alvo);
			assert.equal(campo.modes[0].typeOptions.searchListMethod, metodo, alvo);
			assert.equal(campo.modes[0].typeOptions.searchable, true, alvo);
		}
	});

	// Resposta de lista nos dois formatos que a API pode usar.
	const itens = [
		{ id: 'b1', name: 'Vendas' },
		{ id: 'b2', name: 'Suporte Técnico' },
	];

	async function buscar(metodo, parametros, filtro, respondedor) {
		const contexto = criarContexto(2, parametros, respondedor);
		const resultado = await listSearch[metodo].call(contexto, filtro, undefined);
		return { resultado, requisicoes: contexto.requisicoes };
	}

	it('K4.02 a lista de quadros chama a rota e filtra no node', async () => {
		const { resultado, requisicoes } = await buscar('searchKanbanBoards', {}, 'TECNICO', () => ({
			data: itens,
		}));
		assert.equal(requisicoes.length, 1);
		assert.equal(requisicoes[0].method, 'GET');
		assert.equal(requisicoes[0].url, '/api/v1/kanban-boards');
		assert.deepEqual(requisicoes[0].qs, { query: '{"paginate":false,"withTotal":false}' });
		assert.deepEqual(resultado.results, [{ name: 'Suporte Técnico', value: 'b2' }]);
		// Array puro também vale, e a lista não pagina.
		const puro = await buscar('searchKanbanBoards', {}, 'vend', () => itens);
		assert.deepEqual(puro.resultado.results, [{ name: 'Vendas', value: 'b1' }]);
		assert.equal(puro.resultado.paginationToken, undefined);
	});

	it('K4.02b item nulo ou sem id fica fora da lista de quadros', async () => {
		const { resultado } = await buscar('searchKanbanBoards', {}, '', () => ({
			data: [null, { name: 'Sem id' }, { id: 'b1', name: 'Vendas' }],
		}));
		assert.deepEqual(resultado.results, [{ name: 'Vendas', value: 'b1' }]);
	});

	it('K4.03 a lista de colunas filtra pelo quadro do campo auxiliar', async () => {
		const colunas = [{ id: 'c1', name: 'Novos' }];
		const com = await buscar(
			'searchKanbanColumns',
			{ operation: 'e305', filterBoard_e305: lista('b1') },
			'',
			() => ({ data: colunas }),
		);
		assert.equal(com.requisicoes[0].url, '/api/v1/kanban-columns');
		assert.deepEqual(com.requisicoes[0].qs, {
			query: '{"paginate":false,"withTotal":false,"where":{"kanbanBoardId":"b1"}}',
		});
		assert.deepEqual(com.resultado.results, [{ name: 'Novos', value: 'c1' }]);
		const sem = await buscar('searchKanbanColumns', { operation: 'e305' }, '', () => ({ data: colunas }));
		assert.deepEqual(sem.requisicoes[0].qs, { query: '{"paginate":false,"withTotal":false}' });
	});

	it('K4.04 a lista de cards exige a coluna do campo auxiliar', async () => {
		const cartoes = [
			{ id: 'k1', ticket: { contact: { name: 'Ana' } } },
			{ id: 'k2' },
		];
		const com = await buscar(
			'searchKanbanCards',
			{ operation: 'e311', filterColumn_e311: lista('c1') },
			'',
			() => ({ data: cartoes }),
		);
		assert.equal(com.requisicoes[0].url, '/api/v1/kanban-cards');
		assert.deepEqual(com.requisicoes[0].qs, {
			query: '{"where":{"columnId":"c1"},"paginate":false,"withTotal":false}',
		});
		// Rótulo: nome do contato quando vem, senão o ID do card.
		assert.deepEqual(com.resultado.results, [
			{ name: 'Ana', value: 'k1' },
			{ name: 'k2', value: 'k2' },
		]);
		// Sem coluna escolhida: lista vazia e nenhuma chamada à API.
		const sem = await buscar('searchKanbanCards', { operation: 'e311' }, '', () => ({ data: cartoes }));
		assert.deepEqual(sem.resultado.results, []);
		assert.equal(sem.requisicoes.length, 0);
	});

	it('K4.05 os campos auxiliares existem só na versão 2 e não saem na requisição', async () => {
		const comColuna = ['e305', 'e307', 'e308', 'e309', 'e310', 'e312', 'e313', 'e315'];
		const comCard = ['e311', 'e313', 'e314', 'e315'];
		for (const operacao of comColuna) {
			const campos = propriedades.filter((p) => p.name === `filterBoard_${operacao}`);
			assert.equal(campos.length, 1, `filterBoard_${operacao}`);
			assert.equal(campos[0].displayName, 'Filter by Board');
			assert.equal(campos[0].type, 'resourceLocator');
			assert.equal(visivelNa(campos[0], 1), false);
			assert.equal(visivelNa(campos[0], 2), true);
		}
		for (const operacao of comCard) {
			const campos = propriedades.filter((p) => p.name === `filterColumn_${operacao}`);
			assert.equal(campos.length, 1, `filterColumn_${operacao}`);
			assert.equal(campos[0].displayName, 'Filter by Column');
			assert.equal(visivelNa(campos[0], 1), false);
		}
		// Operações sem coluna ou card não ganham campo auxiliar.
		// filterColumn_ existe só onde há card; as demais (inclusive as que só pedem coluna) não o têm.
		for (const operacao of ['e305', 'e307', 'e308', 'e309', 'e310', 'e312']) {
			assert.equal(propriedades.filter((p) => p.name === `filterColumn_${operacao}`).length, 0, operacao);
		}
		for (const operacao of ['e299', 'e300', 'e301', 'e302', 'e303', 'e304', 'e306']) {
			assert.equal(propriedades.filter((p) => p.name === `filterBoard_${operacao}`).length, 0, operacao);
			assert.equal(propriedades.filter((p) => p.name === `filterColumn_${operacao}`).length, 0, operacao);
		}
		// O valor do auxiliar nunca chega à requisição.
		const { req } = await v2({
			operation: 'e313',
			path_e313_cardId: lista('k1'),
			filterBoard_e313: lista('b9'),
			filterColumn_e313: lista('c9'),
			bodyFields_e313_fields: { columnId: lista('c2') },
		});
		assert.equal(JSON.stringify(req).includes('b9'), false);
		assert.equal(JSON.stringify(req).includes('c9'), false);
	});

	it('K4.06 o 401 do Digisac nas três listas vira NodeApiError', async () => {
		const falha = () => {
			throw Object.assign(new Error('Unauthorized'), { httpCode: '401', statusCode: 401 });
		};
		const casos = [
			['searchKanbanBoards', {}],
			['searchKanbanColumns', { operation: 'e305' }],
			['searchKanbanCards', { operation: 'e311', filterColumn_e311: lista('c1') }],
		];
		for (const [metodo, parametros] of casos) {
			await assert.rejects(buscar(metodo, parametros, '', falha), (erro) => {
				assert.equal(erro.name, 'NodeApiError', metodo);
				assert.equal(String(erro.httpCode), '401', metodo);
				return true;
			});
		}
	});

	it('K4.07 a versão 2 lê list e id e tira o espaço das pontas', async () => {
		for (const valor of [lista('b1'), { mode: 'id', value: ' b1 ' }]) {
			const quadro = await v2({ operation: 'e300', path_e300_boardId: valor });
			assert.equal(quadro.req.url, '/api/v1/kanban-boards/b1');
			const coluna = await v2({ operation: 'e305', path_e305_columnId: valor });
			assert.equal(coluna.req.url, '/api/v1/kanban-columns/b1');
			const card = await v2({ operation: 'e311', path_e311_cardId: valor });
			assert.equal(card.req.url, '/api/v1/kanban-cards/b1');
		}
	});
});
