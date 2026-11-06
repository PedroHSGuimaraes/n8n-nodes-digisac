// Testes do plano rotas-novas — Fatia S5: versão 1 intacta, versão 1.2.0 e documentação.
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
			c === versao || (typeof c === 'object' && c._cnd?.gte !== undefined && c._cnd.gte <= versao),
	);
}
// Procura a cópia de um parâmetro visível numa versão, pelo nome.
const copia = (nome, versao) => propriedades.filter((p) => p.name === nome && visivelNa(p, versao));

describe('compatibilidade e documentação', () => {
	it('K5.01 a versão 1 vê as operações novas com campos de texto', () => {
		const visiveisNaV1 = propriedades.filter((p) => visivelNa(p, 1));
		// A versão 1 lista as 17 operações no recurso Kanban.
		const operacoes = visiveisNaV1.filter(
			(p) => p.name === 'operation' && p.displayOptions?.show?.resource?.includes('general_kanban'),
		);
		assert.deepEqual(
			operacoes[0].options.map((o) => o.value),
			IDS_KANBAN,
		);
		// Nenhum campo do Kanban visível na versão 1 é Resource Locator, e os auxiliares não aparecem.
		for (const p of visiveisNaV1) {
			const operacao = p.displayOptions?.show?.operation ?? [];
			if (!operacao.some((id) => IDS_KANBAN.includes(id))) continue;
			assert.notEqual(p.type, 'resourceLocator', p.name);
			assert.doesNotMatch(p.name, /^filter(Board|Column)_/, p.name);
		}
		// Os IDs de path do Kanban existem como texto na versão 1.
		for (const nome of ['path_e300_boardId', 'path_e305_columnId', 'path_e311_cardId']) {
			assert.equal(copia(nome, 1)[0].type, 'string', nome);
		}
	});

	it('K5.02 a versão do pacote e o changelog dizem 1.2.0', () => {
		const pacote = JSON.parse(fs.readFileSync(path.join(raiz, 'package.json'), 'utf8'));
		assert.equal(pacote.version, '1.2.0');
		const changelog = fs.readFileSync(path.join(raiz, 'CHANGELOG.md'), 'utf8');
		assert.match(changelog, /^## 1\.2\.0/m);
		// A seção 1.2.0 (e só ela) cita as 17 operações, os IDs estáveis e a confirmação de apagar.
		const secao = changelog.split(/^## /m).find((bloco) => bloco.startsWith('1.2.0'));
		assert.match(secao, /17 operações/);
		assert.match(secao, /e299/);
		assert.match(secao, /Confirm Delete/);
	});

	it('K6.02 README e CHANGELOG avisam as suposições', () => {
		// Suposições sem chamada real: `/api` nos dois PUT e `position` como número (achados F1 e F3).
		const readme = fs.readFileSync(path.join(raiz, 'README.md'), 'utf8');
		const secaoReadme =
			readme.split(/^#{2,3} /m).find((b) => b.startsWith('Kanban (quadros')) ?? '';
		assert.match(secaoReadme, /\/api\/v1\/kanban-columns/);
		assert.match(secaoReadme, /404/);
		assert.match(secaoReadme, /`Position`.*número/);
		const changelog = fs.readFileSync(path.join(raiz, 'CHANGELOG.md'), 'utf8');
		const secao = changelog.split(/^## /m).find((bloco) => bloco.startsWith('1.2.0')) ?? '';
		assert.match(secao, /sem `\/api`/);
		assert.match(secao, /`position`.*número/);
	});

	it('K5.03 o README documenta o Kanban', () => {
		const readme = fs.readFileSync(path.join(raiz, 'README.md'), 'utf8');
		for (const [, , , nome] of KANBAN) assert.ok(readme.includes(nome), `README sem "${nome}"`);
		// Cada parte fica na seção certa do README, não solta em qualquer linha.
		const secao = (titulo) => readme.split(/^#{2,3} /m).find((b) => b.startsWith(titulo)) ?? '';
		assert.match(secao('Kanban (quadros'), /Confirm Delete/);
		assert.match(secao('Mover card entre colunas'), /Editar card/);
		assert.match(secao('Excluir card com confirmação'), /Confirm Delete/);
		assert.match(secao('Boas práticas para LLMs'), /Kanban como tool/);
	});

	it('K5.04 a documentação gerada lista 315 chamadas', () => {
		const docs = fs.readFileSync(path.join(raiz, 'docs/api-calls.md'), 'utf8');
		// A linha de total do cabeçalho, e não um ID como e315 solto na tabela.
		assert.match(docs, /Total de chamadas documentadas: 315/);
		assert.match(docs, /kanban-boards/);
		const readme = fs.readFileSync(path.join(raiz, 'README.md'), 'utf8');
		// O README escrito à mão sobrevive: a seção de Desenvolvimento continua lá.
		assert.match(readme, /Desenvolvimento/);
	});
});
