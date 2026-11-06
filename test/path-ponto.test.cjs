// Testes do ticket path-dot-segments (1.2.1): "." e ".." nunca entram no caminho da URL.
// O URL resolve esses valores para fora do recurso (`/api/v1/<recurso>/..` vira `/api/v1/`), então um
// DELETE com ".." chamaria outra rota do Digisac em silêncio. Se um teste daqui quebra, uma operação
// voltou a aceitar o valor, ou um ID normal passou a ser recusado.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { describe, it } = require('node:test');

const { Digisac } = require('../dist/nodes/Digisac/Digisac.node');
const { DIGISAC_ENDPOINTS } = require('../dist/nodes/Digisac/generated/endpoints');
const { criarContexto } = require('./contexto.cjs');
const idsAntigos = require('./fixtures/ids-1.1.0.json');

const raiz = path.resolve(__dirname, '..');
// As operações que têm parâmetro de caminho: 137 no catálogo de 315.
const comCaminho = DIGISAC_ENDPOINTS.filter((e) => e.pathParams.length > 0);

// Monta os parâmetros do node: o mesmo valor em todo parâmetro de caminho. Na versão 2 o valor
// vai como Resource Locator (modo id); na versão 1 vai como texto.
function parametrosCom(endpoint, valor, versao) {
	const parametros = { operation: endpoint.id, [`confirmDelete_${endpoint.id}`]: true };
	for (const parametro of endpoint.pathParams) {
		parametros[`path_${endpoint.id}_${parametro}`] =
			versao === 2 ? { mode: 'id', value: valor } : valor;
	}
	return parametros;
}

// Roda o execute e devolve o contexto, com as requisições gravadas.
async function executar(endpoint, valor, versao) {
	const contexto = criarContexto(versao, parametrosCom(endpoint, valor, versao));
	await new Digisac().execute.call(contexto);
	return contexto;
}

describe('. e .. no parâmetro de caminho', () => {
	it('P1.01 toda operação com parâmetro de caminho recusa . e ..', async () => {
		assert.equal(comCaminho.length, 137);
		for (const endpoint of comCaminho) {
			for (const ponto of ['.', '..']) {
				for (const versao of [1, 2]) {
					const contexto = criarContexto(versao, parametrosCom(endpoint, ponto, versao));
					await assert.rejects(
						new Digisac().execute.call(contexto),
						/is not valid/,
						`${endpoint.id} ${endpoint.method} valor=${ponto} v${versao}`,
					);
					// A recusa vem antes de qualquer requisição ao Digisac.
					assert.equal(
						contexto.requisicoes.length,
						0,
						`${endpoint.id} valor=${ponto} v${versao}: não pode haver requisição`,
					);
				}
			}
		}
	});

	it('P1.02 ID normal, com ponto no meio e numérico seguem iguais', async () => {
		// "a.b" tem ponto, "..." tem três pontos e não é segmento de ponto, "123" é número.
		const valores = ['x1', 'a.b', '...', '123'];
		// Uma operação antiga de cada método com caminho, mais todas as do Kanban com caminho.
		const metodos = new Set();
		const amostra = comCaminho.filter((e) => {
			if (e.resource === 'general_kanban') return true;
			if (metodos.has(e.method)) return false;
			metodos.add(e.method);
			return true;
		});
		assert.ok(amostra.length > 8);
		for (const endpoint of amostra) {
			for (const valor of valores) {
				for (const versao of [1, 2]) {
					const contexto = await executar(endpoint, valor, versao);
					const [req] = contexto.requisicoes;
					assert.equal(req.method, endpoint.method, `${endpoint.id} ${valor} v${versao}`);
					// O valor entra na rota codificado, sem ser trocado nem removido.
					const esperado = endpoint.pathParams.reduce(
						(rota, parametro) => rota.replace(`{{${parametro}}}`, encodeURIComponent(valor)),
						endpoint.pathTemplate,
					);
					assert.equal(req.url, esperado, `${endpoint.id} ${valor} v${versao}`);
				}
			}
		}
	});

	it('P1.03 nenhum ID de operação nem parâmetro de caminho muda', () => {
		// Os 298 IDs da 1.1.0 continuam com o mesmo método e a mesma URL crua.
		const atual = new Map(DIGISAC_ENDPOINTS.map((e) => [e.id, e]));
		for (const antigo of idsAntigos) {
			const novo = atual.get(antigo.id);
			assert.ok(novo, `${antigo.id} sumiu`);
			assert.equal(`${novo.method} ${novo.rawUrl}`, `${antigo.method} ${antigo.rawUrl}`, antigo.id);
		}
		assert.equal(DIGISAC_ENDPOINTS.length, 315);
		// Os 138 parâmetros de caminho continuam com o mesmo nome de campo no node, nas duas versões.
		const nomes = new Digisac().description.properties.map((p) => p.name);
		let parametros = 0;
		for (const endpoint of comCaminho) {
			for (const parametro of endpoint.pathParams) {
				parametros += 1;
				assert.ok(nomes.includes(`path_${endpoint.id}_${parametro}`), `${endpoint.id}/${parametro}`);
			}
		}
		assert.equal(parametros, 138);
	});

	it('P1.04 versão 1.2.1 e changelog dizem que a recusa é nova', () => {
		const pacote = JSON.parse(fs.readFileSync(path.join(raiz, 'package.json'), 'utf8'));
		assert.equal(pacote.version, '1.2.1');
		const changelog = fs.readFileSync(path.join(raiz, 'CHANGELOG.md'), 'utf8');
		const secao = changelog.split(/^## /m).find((bloco) => bloco.startsWith('1.2.1'));
		assert.ok(secao, 'CHANGELOG sem a seção 1.2.1');
		// A seção diz o valor, o efeito e que a recusa é nova.
		assert.match(secao, /`\.`/);
		assert.match(secao, /`\.\.`/);
		assert.match(secao, /recusa nova/i);
		assert.match(secao, /137/);
	});
});
