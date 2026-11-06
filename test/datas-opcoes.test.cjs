// Testes da fatia S4: datas e valores fixos guiados na versão 2 do node.
// Na versão 1 esses campos são texto livre; na 2 viram seletor de data e lista de opções,
// sem mudar o que o Digisac recebe quando a pessoa escolhe o mesmo valor.
const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const { Digisac } = require('../dist/nodes/Digisac/Digisac.node');
const { DIGISAC_ENDPOINTS } = require('../dist/nodes/Digisac/generated/endpoints');
const { criarContexto } = require('./contexto.cjs');

const propriedades = new Digisac().description.properties;

// Diz se a propriedade aparece na versão 2 (sem condição de versão, ou com gte até 2).
function visivelNaV2(propriedade) {
	const condicao = propriedade.displayOptions?.show?.['@version'];
	if (condicao === undefined) return true;
	return condicao.some(
		(c) => c === 2 || (typeof c === 'object' && c._cnd?.gte !== undefined && c._cnd.gte <= 2),
	);
}
const copiaV2 = (nome) => propriedades.filter((p) => p.name === nome && visivelNaV2(p));

// Roda o execute no contexto falso e devolve a requisição gravada.
async function executar(typeVersion, parametros) {
	const contexto = criarContexto(typeVersion, parametros);
	await new Digisac().execute.call(contexto);
	return contexto.requisicoes[0];
}

describe('datas na versão 2', () => {
	it('S4.01 datas viram dateTime em todas as operações', () => {
		const padrao = /^queryKey_e\d+_(startPeriod|endPeriod|from|to)$/;
		const nomes = [...new Set(propriedades.filter((p) => padrao.test(p.name)).map((p) => p.name))];
		assert.equal(nomes.length, 50, 'o catálogo tem 50 campos de data na query');
		for (const nome of nomes) {
			const copias = copiaV2(nome);
			assert.equal(copias.length, 1, nome);
			assert.equal(copias[0].type, 'dateTime', nome);
		}
	});

	it('S4.02 data da v2 sai em UTC na query', async () => {
		const req = await executar(2, {
			operation: 'e101',
			queryKey_e101_startPeriod: '2026-01-01T00:00:00.000-03:00',
		});
		assert.equal(req.qs.startPeriod, '2026-01-01T03:00:00.000Z');
	});

	it('S4.03 data inválida lança erro de parâmetro', async () => {
		await assert.rejects(
			executar(2, { operation: 'e101', queryKey_e101_startPeriod: 'não é data' }),
			(erro) => {
				assert.equal(erro.message, "The 'Start Period' parameter is not a valid date [item 0]");
				return true;
			},
		);
	});

	it('S4.08 datas estritas: lixo e dia inexistente falham, Date e sem fuso valem', async () => {
		for (const ruim of ['5', '2026', '2026-02-30', '2026-13-01']) {
			await assert.rejects(
				executar(2, { operation: 'e101', queryKey_e101_startPeriod: ruim }),
				/is not a valid date/,
				ruim,
			);
		}
		// Sem fuso o valor é lido como UTC, igual em qualquer servidor.
		const semFuso = await executar(2, {
			operation: 'e101',
			queryKey_e101_startPeriod: '2026-01-01T00:00:00',
		});
		assert.equal(semFuso.qs.startPeriod, '2026-01-01T00:00:00.000Z');
		const soData = await executar(2, {
			operation: 'e101',
			queryKey_e101_startPeriod: '2026-01-31',
		});
		assert.equal(soData.qs.startPeriod, '2026-01-31T00:00:00.000Z');
		// Objeto Date vindo de expressão ($now) não pode sumir calado.
		const objeto = await executar(2, {
			operation: 'e101',
			queryKey_e101_startPeriod: new Date('2026-03-05T10:00:00.000Z'),
		});
		assert.equal(objeto.qs.startPeriod, '2026-03-05T10:00:00.000Z');
		// DateTime do Luxon tem toISO().
		const luxon = await executar(2, {
			operation: 'e101',
			queryKey_e101_startPeriod: { toISO: () => '2026-03-05T10:00:00.000-03:00' },
		});
		assert.equal(luxon.qs.startPeriod, '2026-03-05T13:00:00.000Z');
	});

	it('S4.07 v1 envia a data em texto sem conversão', async () => {
		const req = await executar(1, {
			operation: 'e101',
			queryKey_e101_startPeriod: '2026-01-01T00:00:00.000Z',
			queryKey_e101_endPeriod: '2026-01-31',
		});
		assert.equal(req.qs.startPeriod, '2026-01-01T00:00:00.000Z');
		// Data curta passa como veio: a v1 nunca validou nem converteu.
		assert.equal(req.qs.endPeriod, '2026-01-31');
	});
});

describe('valores fixos na versão 2', () => {
	// Campos de query cujo placeholder da documentação lista alternativas, lidos do catálogo.
	function camposComAlternativas() {
		const chaves = ['status', 'periodType', 'type', 'departmentParticipation', 'userParticipation'];
		const achados = [];
		for (const operacao of DIGISAC_ENDPOINTS) {
			for (const parte of operacao.queryTemplate.split('&')) {
				const [chave, ...resto] = parte.split('=');
				const alternativas = /\{\{([^}]*\/[^}]*)\}\}/.exec(resto.join('='));
				if (chaves.includes(chave) && alternativas) {
					achados.push({
						nome: `queryKey_${operacao.id}_${chave}`,
						valores: alternativas[1].split('/').map((v) => v.trim()),
					});
				}
			}
		}
		return achados;
	}

	it('S4.04 valores fixos viram options com as alternativas da documentação', () => {
		const campos = camposComAlternativas();
		assert.equal(campos.length, 16, 'o catálogo tem 16 campos com alternativas');
		for (const { nome, valores } of campos) {
			const copias = copiaV2(nome);
			assert.equal(copias.length, 1, nome);
			assert.equal(copias[0].type, 'options', nome);
			// A primeira opção vazia mantém o filtro opcional, como na v1 (padrão vazio).
			assert.deepEqual(
				copias[0].options.map((o) => o.value),
				['', ...valores],
				nome,
			);
			assert.equal(copias[0].default, '', nome);
		}
	});

	it('S4.05 options saem na query com o valor escolhido', async () => {
		const req = await executar(2, {
			operation: 'e112',
			queryKey_e112_type: 'nps',
			queryKey_e112_periodType: 'open',
		});
		assert.equal(req.qs.type, 'nps');
		assert.equal(req.qs.periodType, 'open');
	});

	it('S4.09 periodType open sai como openDate onde a documentação cola Date', async () => {
		// e109 documenta periodType={{open/close}}Date: a opção "open" vira "openDate" na rede.
		const req = await executar(2, { operation: 'e109', queryKey_e109_periodType: 'open' });
		assert.equal(req.qs.periodType, 'openDate');
	});

	it('S4.06 origin do body vira options na v2 e continua texto na v1', () => {
		const colecoes = [
			...new Set(
				propriedades
					.filter(
						(p) => p.name.startsWith('bodyFields_') && p.options.some((o) => o.name === 'origin'),
					)
					.map((p) => p.name),
			),
		];
		assert.equal(colecoes.length, 10, 'o catálogo tem 10 coleções de body com origin');
		for (const nome of colecoes) {
			const todas = propriedades.filter((p) => p.name === nome);
			const v1 = todas.find((p) => !visivelNaV2(p));
			const [v2] = copiaV2(nome);
			assert.equal(v1.options.find((o) => o.name === 'origin').type, 'string', nome);
			const origem = v2.options.find((o) => o.name === 'origin');
			assert.equal(origem.type, 'options', nome);
			assert.deepEqual(
				origem.options.map((o) => o.value),
				['', 'bot', 'user'],
				nome,
			);
		}
	});
});
