// Testes do plano rotas-novas — Fatia S2: as 17 operações enviam a requisição documentada.
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

describe('operações do Kanban', () => {
	it('K2.01 listar quadros envia a query fixa e o timeout', async () => {
		const { req } = await v2({ operation: 'e299' });
		assert.equal(req.method, 'GET');
		assert.equal(req.url, '/api/v1/kanban-boards');
		assert.deepEqual(req.qs, { query: '{"paginate":false,"withTotal":false}' });
		assert.equal(req.timeout, 30000);
	});

	it('K2.02 buscar quadro chama o caminho com o ID', async () => {
		const { req } = await v2({ operation: 'e300', path_e300_boardId: lista('b1') });
		assert.equal(req.method, 'GET');
		assert.equal(req.url, '/api/v1/kanban-boards/b1');
	});

	it('K2.03 criar quadro envia só os campos adicionados', async () => {
		const { req } = await v2({
			operation: 'e301',
			bodyFields_e301_fields: { name: 'Vendas', departmentIds: '["d1"]', visibleTickets: 'all' },
		});
		assert.equal(req.method, 'POST');
		assert.equal(req.url, '/api/v1/kanban-boards');
		assert.deepEqual(req.body, { name: 'Vendas', departmentIds: ['d1'], visibleTickets: 'all' });
		// O booleano vai como booleano, ligado ou desligado, quando a pessoa adiciona o campo.
		for (const valor of [true, false]) {
			const { req: r } = await v2({
				operation: 'e301',
				bodyFields_e301_fields: { name: 'Vendas', timeoutAlertEnabled: valor },
			});
			assert.equal(r.body.timeoutAlertEnabled, valor);
		}
		// A coleção do editor nasce vazia: nada vai ao Digisac sem a pessoa escolher.
		const colecao = copia('bodyFields_e301_fields', 2)[0];
		assert.deepEqual(colecao.default, {});
		const tipos = Object.fromEntries(colecao.options.map((o) => [o.name, o.type]));
		assert.equal(tipos.timeoutAlertEnabled, 'boolean');
		assert.equal(tipos.visibleTickets, 'options');
	});

	it('K2.04 editar quadro envia só o nome', async () => {
		const { req } = await v2({
			operation: 'e302',
			path_e302_boardId: lista('b1'),
			bodyFields_e302_fields: { name: 'Vendas 2' },
		});
		assert.equal(req.method, 'PUT');
		assert.equal(req.url, '/api/v1/kanban-boards/b1');
		assert.deepEqual(req.body, { name: 'Vendas 2' });
	});

	it('K2.05 listar colunas monta a query com e sem quadro', async () => {
		const fixa = '"withTotal":false,"paginate":false';
		const incluir = '"include":["cards","cards.ticket","cards.ticket.contact"]';
		const com = await v2({ operation: 'e304', query_e304_boardId: lista('b1') });
		assert.equal(com.req.url, '/api/v1/kanban-columns');
		assert.equal(
			com.req.qs.query,
			`{${fixa},"where":{"kanbanBoardId":"b1"},${incluir}}`,
		);
		const sem = await v2({ operation: 'e304' });
		assert.equal(sem.req.qs.query, `{${fixa},${incluir}}`);
	});

	it('K2.06 buscar coluna chama o caminho com a query estática', async () => {
		const { req } = await v2({ operation: 'e305', path_e305_columnId: lista('c1') });
		assert.equal(req.method, 'GET');
		assert.equal(req.url, '/api/v1/kanban-columns/c1');
		// A chave repetida include[] guarda o último valor, como em todo o catálogo (fora de escopo).
		assert.deepEqual(req.qs, { 'include[]': 'cards.ticket.contact' });
	});

	it('K2.07 criar coluna envia número e booleano certos', async () => {
		const { req } = await v2({
			operation: 'e306',
			bodyFields_e306_fields: {
				name: 'Em Andamento',
				kanbanBoardId: lista('b1'),
				ticketWaitTimeMinutes: 60,
			},
		});
		assert.equal(req.method, 'POST');
		assert.equal(req.url, '/api/v1/kanban-columns');
		assert.deepEqual(req.body, { name: 'Em Andamento', kanbanBoardId: 'b1', ticketWaitTimeMinutes: 60 });
		const { req: r } = await v2({
			operation: 'e306',
			bodyFields_e306_fields: { name: 'X', isDraggable: true },
		});
		assert.equal(r.body.isDraggable, true);
	});

	it('K2.08 editar coluna envia só o nome', async () => {
		const { req } = await v2({
			operation: 'e307',
			path_e307_columnId: lista('c1'),
			bodyFields_e307_fields: { name: 'Triagem' },
		});
		assert.equal(req.method, 'PUT');
		assert.equal(req.url, '/api/v1/kanban-columns/c1');
		assert.deepEqual(req.body, { name: 'Triagem' });
	});

	it('K2.09 reordenar coluna envia antes e depois', async () => {
		const { req } = await v2({
			operation: 'e309',
			path_e309_columnId: lista('c1'),
			bodyFields_e309_fields: { beforeColumnId: lista('c0'), afterColumnId: lista('c2') },
		});
		assert.equal(req.method, 'PATCH');
		assert.equal(req.url, '/api/v1/kanban-columns/c1/reorder');
		assert.deepEqual(req.body, { beforeColumnId: 'c0', afterColumnId: 'c2' });
	});

	it('K2.10 listar cards monta a query com coluna e usuário, só coluna ou nenhum', async () => {
		const base = '"paginate":false,"withTotal":false';
		const completo = await v2({
			operation: 'e310',
			query_e310_columnId: lista('c1'),
			query_e310_userId: 'u1',
		});
		assert.equal(completo.req.url, '/api/v1/kanban-cards');
		assert.equal(
			completo.req.qs.query,
			`{"where":{"columnId":"c1"},${base},"customFilter":{"includeUnassigned":true,"userIds":["u1"]}}`,
		);
		const soColuna = await v2({ operation: 'e310', query_e310_columnId: lista('c1') });
		assert.equal(soColuna.req.qs.query, `{"where":{"columnId":"c1"},${base}}`);
		const nenhum = await v2({ operation: 'e310' });
		assert.equal(nenhum.req.qs.query, `{${base}}`);
	});

	it('K2.10b usuário só com espaços não entra na query de listar cards', async () => {
		const { req } = await v2({
			operation: 'e310',
			query_e310_columnId: lista('c1'),
			query_e310_userId: '   ',
		});
		assert.equal(req.qs.query, '{"where":{"columnId":"c1"},"paginate":false,"withTotal":false}');
	});

	it('K2.11 buscar card chama o caminho com o ID', async () => {
		const { req } = await v2({ operation: 'e311', path_e311_cardId: lista('k1') });
		assert.equal(req.method, 'GET');
		assert.equal(req.url, '/api/v1/kanban-cards/k1');
	});

	it('K2.12 criar card envia coluna e chamado', async () => {
		const { req } = await v2({
			operation: 'e312',
			bodyFields_e312_fields: { columnId: lista('c1'), ticketId: 't1' },
		});
		assert.equal(req.method, 'POST');
		assert.equal(req.url, '/api/v1/kanban-cards');
		assert.deepEqual(req.body, { columnId: 'c1', ticketId: 't1' });
	});

	it('K2.13 editar card envia a posição como número só quando adicionada', async () => {
		const { req } = await v2({
			operation: 'e313',
			path_e313_cardId: lista('k1'),
			bodyFields_e313_fields: { columnId: lista('c2'), position: 3 },
		});
		assert.equal(req.method, 'PUT');
		assert.equal(req.url, '/api/v1/kanban-cards/k1');
		assert.deepEqual(req.body, { columnId: 'c2', position: 3 });
		const { req: sem } = await v2({
			operation: 'e313',
			path_e313_cardId: lista('k1'),
			bodyFields_e313_fields: { columnId: lista('c2') },
		});
		assert.deepEqual(sem.body, { columnId: 'c2' });
	});

	it('K2.14 reordenar card envia os quatro campos', async () => {
		const { req } = await v2({
			operation: 'e315',
			path_e315_cardId: lista('k1'),
			bodyFields_e315_fields: {
				beforeCardId: lista('k0'),
				afterCardId: lista('k2'),
				columnId: lista('c2'),
				moveTo: 'top',
			},
		});
		assert.equal(req.method, 'PATCH');
		assert.equal(req.url, '/api/v1/kanban-cards/k1/reorder');
		assert.deepEqual(req.body, {
			beforeCardId: 'k0',
			afterCardId: 'k2',
			columnId: 'c2',
			moveTo: 'top',
		});
	});

	it('K2.15 ID de path vazio lança o erro do campo certo', async () => {
		const casos = [
			['e300', 'path_e300_boardId', 'Board Id', 'board'],
			['e305', 'path_e305_columnId', 'Column Id', 'column'],
			['e311', 'path_e311_cardId', 'Card Id', 'card'],
		];
		for (const [operacao, campo, rotulo, substantivo] of casos) {
			await assert.rejects(v2({ operation: operacao, [campo]: lista('') }), (erro) => {
				assert.equal(erro.message, `The '${rotulo}' parameter is empty [item 0]`);
				assert.equal(erro.description, `Choose a ${substantivo} from the list or paste its ID`);
				return true;
			});
		}
	});

	it('K2.16 erros do Digisac viram NodeApiError com o código HTTP', async () => {
		// Uma operação de cada método (GET, POST, PUT, PATCH, DELETE) e cada status do Surface.
		// Todas as 17 operações, cada uma com o ID de path e a confirmação que ela pede.
		const operacoes = KANBAN.map(([id, , caminho]) => {
			const extra = {};
			const parametro = /\{\{(\w+)\}\}/.exec(caminho)?.[1];
			if (parametro) extra[`path_${id}_${parametro}`] = lista('x1');
			if (id === 'e303' || id === 'e308' || id === 'e314') extra[`confirmDelete_${id}`] = true;
			return [id, extra];
		});
		for (const status of ['401', '404']) {
			for (const [operacao, extra] of operacoes) {
				const falha = () => {
					throw Object.assign(new Error('Request failed'), {
						httpCode: status,
						statusCode: Number(status),
					});
				};
				await assert.rejects(v2({ operation: operacao, ...extra }, falha), (erro) => {
					// O n8n reescreve a mensagem do 401/404; o que fica estável é o tipo e o código HTTP.
					assert.equal(erro.constructor.name === 'NodeOperationError' ? erro.cause?.name : erro.name, 'NodeApiError');
					assert.equal(String(erro.httpCode ?? erro.cause?.httpCode), status, operacao);
					return true;
				});
			}
		}
	});
});
