// Testes da fatia S2: a versão 1 do node precisa mandar a mesma requisição da 1.0.3.
// Workflows salvos guardam typeVersion 1; se estes testes quebram, workflow de cliente quebra.
const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const { Digisac } = require('../dist/nodes/Digisac/Digisac.node');
const { criarContexto } = require('./contexto.cjs');
const instantaneo = require('./fixtures/propriedades-1.0.3.json');

// Parâmetros mínimos da operação e001 (POST /api/v1/bots/{botId}/trigger-signal/{contactId}).
const baseE001 = {
	operation: 'e001',
	path_e001_botId: 'b1',
	path_e001_contactId: 'c1',
	queryKey_e001_flag: 'flagAqui',
};

// Roda o execute do node com o contexto falso e devolve contexto e saída.
async function executar(typeVersion, parametros, respondedor) {
	const contexto = criarContexto(typeVersion, parametros, respondedor);
	const saida = await new Digisac().execute.call(contexto);
	return { contexto, saida };
}

describe('versão 1 do node', () => {
	it('S2.01a v1 envia o POST de e001 com query e timeout', async () => {
		const { contexto } = await executar(1, baseE001);
		const [req] = contexto.requisicoes;
		// Rota, método e query iguais aos da 1.0.3.
		assert.equal(req.method, 'POST');
		assert.equal(req.baseURL, 'https://empresa.digisac.app');
		assert.equal(req.url, '/api/v1/bots/b1/trigger-signal/c1');
		assert.deepEqual(req.qs, { flag: 'flagAqui' });
		assert.equal(req.tipoCredencial, 'digisacApi');
		// Regra nova da máquina: toda chamada HTTP sai com timeout explícito.
		assert.equal(req.timeout, 30000);
	});

	it('S2.01b v1 com espaço nas pontas não limpa o valor', async () => {
		const { contexto } = await executar(1, { ...baseE001, path_e001_contactId: ' c1 ' });
		// A 1.0.3 só codifica o texto: o espaço vira %20 e continua na rota.
		assert.equal(contexto.requisicoes[0].url, '/api/v1/bots/b1/trigger-signal/%20c1%20');
	});

	it('S2.02 v1 vazio lança erro de parâmetro de path', async () => {
		await assert.rejects(executar(1, { ...baseE001, path_e001_contactId: '' }), (erro) => {
			assert.match(
				erro.message,
				/Missing required path parameter for POST \/api\/v1\/bots\/\{\{botId\}\}\/trigger-signal\/\{\{contactId\}\}/,
			);
			return true;
		});
	});

	it('S2.03 v1 mantém name e type de todo parâmetro da 1.0.3', () => {
		const propriedades = new Digisac().description.properties;
		// Chave de comparação: name + type + onde o campo aparece (sem a condição @version, nova na v2).
		// As operações do Kanban (e299 a e315) são novas e entram na lista `operation` dos campos globais
		// (como `useRawBodyJson`). Elas saem da comparação: o que a 1.1.0 garante é que nenhuma
		// operação antiga perdeu ou trocou parâmetro, e a lista das antigas continua igual.
		const operacoesNovas = new Set(
			Array.from({ length: 17 }, (_, i) => `e${String(299 + i)}`),
		);
		const chave = (p, show) => {
			const { '@version': _ignorado, ...resto } = show ?? {};
			if (Array.isArray(resto.operation)) {
				resto.operation = resto.operation.filter((id) => !operacoesNovas.has(id));
			}
			return `${p.name}|${p.type}|${JSON.stringify(resto)}`;
		};
		// Só entram as propriedades visíveis na versão 1: sem condição de versão ou com a 1 nela.
		const visiveisNaV1 = new Set(
			propriedades
				.filter((p) => {
					const cond = p.displayOptions?.show?.['@version'];
					return cond === undefined || cond.includes(1);
				})
				.map((p) => chave(p, p.displayOptions?.show)),
		);
		const faltando = instantaneo.map((p) => chave(p, p.show)).filter((k) => !visiveisNaV1.has(k));
		assert.deepEqual(faltando, [], `parâmetros da 1.0.3 perdidos na v1: ${faltando.length}`);
		// O instantâneo cobre as operações com parâmetros: 275 das 298.
		assert.ok(instantaneo.length > 500, 'instantâneo pequeno demais');
	});

	it('S2.04 formato texto devolve data com o texto', async () => {
		const { saida } = await executar(
			1,
			{ ...baseE001, options: { responseFormat: 'text' } },
			() => 'texto puro',
		);
		assert.deepEqual(saida[0][0].json, { data: 'texto puro' });
	});

	// Regra protegida (achado F1 do revisor): na 1.0.3 um número ou booleano que chega por expressão
	// (`{{ $json.page }}`) num campo de texto saía na query como texto ("5", "0", "true"). Se a v1 voltar a
	// ler esse valor como vazio, o filtro some em silêncio e o workflow salvo busca sem filtro.
	it('S2.05 v1 envia número e booleano de campo de query como texto', async () => {
		const consulta = { operation: 'e101', options: {} };
		for (const [valor, esperado] of [
			[5, '5'],
			[0, '0'],
			[true, 'true'],
			[false, 'false'],
		]) {
			const { contexto } = await executar(1, { ...consulta, queryKey_e101_serviceId: valor });
			assert.deepEqual(
				contexto.requisicoes[0].qs,
				{ serviceId: esperado },
				`v1 deixou de enviar ${String(valor)}`,
			);
		}
	});

	it('S2.06 v1 aceita booleano em ID de path como a 1.0.3', async () => {
		const { contexto } = await executar(1, { ...baseE001, path_e001_botId: true });
		// A 1.0.3 codificava o valor como texto: `true` entrava na rota.
		assert.equal(contexto.requisicoes[0].url, '/api/v1/bots/true/trigger-signal/c1');
	});
});
