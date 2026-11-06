// Testes de estrutura do pacote (fatia S1 do plano node-cli-campos-v2).
// Eles leem package.json, o lock e os workflows e confirmam o contrato da toolchain:
// se alguém voltar para gulp, tirar o lint do CI ou pôr o gerador de volta no build, falham.
const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const path = require('node:path');
const { describe, it } = require('node:test');

// Raiz do repositório: um nível acima da pasta test.
const raiz = path.resolve(__dirname, '..');
// Lê um arquivo texto da raiz sem repetir o caminho em cada teste.
const ler = (...partes) => readFileSync(path.join(raiz, ...partes), 'utf8');
const pacote = JSON.parse(ler('package.json'));

describe('toolchain do node-cli', () => {
	it('S1.01 o build gerou node, credencial e ícones em dist', () => {
		// O npm test roda o build antes; aqui só conferimos o resultado, sem rede (o build não gera nada).
		for (const arquivo of [
			'dist/nodes/Digisac/Digisac.node.js',
			'dist/credentials/DigisacApi.credentials.js',
			'dist/nodes/Digisac/digisac.svg',
			'dist/nodes/Digisac/digisac.png',
			'dist/nodes/Digisac/digisac.dark.png',
			'dist/credentials/digisac.svg',
			'dist/credentials/digisac.png',
			'dist/credentials/digisac.dark.png',
		]) {
			assert.ok(existsSync(path.join(raiz, arquivo)), `faltou ${arquivo}`);
		}
	});

	it('S1.03a usa n8n-node no build e no lint, com strict ligado', () => {
		// O build e o lint oficiais são a exigência da guideline de verificação do n8n.
		assert.equal(pacote.scripts.build, 'n8n-node build');
		assert.equal(pacote.scripts.lint, 'n8n-node lint');
		assert.equal(pacote.n8n.strict, true);
	});

	it('S1.03b fixa as devDependencies do plano e não tem dependencies nem gulp', () => {
		// A versão do node-cli é fixa porque o lint muda de regra entre versões.
		assert.equal(pacote.devDependencies['@n8n/node-cli'], '0.55.5');
		assert.equal(pacote.devDependencies['n8n-workflow'], '^2.46.5');
		// O peer continua aberto, como no template oficial.
		assert.deepEqual(pacote.peerDependencies, { 'n8n-workflow': '*' });
		// Dependência de runtime entra no n8n inteiro e pode conflitar com outros nodes.
		assert.equal(pacote.dependencies, undefined);
		assert.ok(!JSON.stringify(pacote).includes('gulp'), 'package.json não pode citar gulp');
	});

	it('S1.04 o lock resolve n8n-workflow na 2.46 ou mais nova', () => {
		const lock = JSON.parse(ler('package-lock.json'));
		const versao = lock.packages['node_modules/n8n-workflow'].version;
		const [maior, menor] = versao.split('.').map(Number);
		// 2.46.x ou qualquer 2.>46 ou 3.x: o que importa é nunca voltar para 2.16.
		assert.ok(maior > 2 || (maior === 2 && menor >= 46), `n8n-workflow ${versao} é antiga`);
	});

	it('S1.05 mantém os geradores como scripts manuais fora do build', () => {
		assert.ok(pacote.scripts['generate:endpoints'], 'falta generate:endpoints');
		assert.ok(pacote.scripts['generate:docs'], 'falta generate:docs');
		// O gerador baixa a rede; no build ele quebraria o CI sem aviso (AD-008).
		assert.ok(!pacote.scripts.build.includes('generate'), 'build não pode chamar gerador');
	});
});

describe('workflows do GitHub', () => {
	// Pega a node-version declarada em um workflow.
	const versaoNode = (arquivo) =>
		ler('.github', 'workflows', arquivo).match(/node-version:\s*(\S+)/)[1];

	it('S1.06a o CI roda npm ci, lint, teste e build', () => {
		const ci = ler('.github', 'workflows', 'ci.yml');
		for (const comando of ['npm ci', 'npm run lint', 'npm test', 'npm run build']) {
			assert.ok(ci.includes(comando), `ci.yml sem "${comando}"`);
		}
	});

	it('S1.06b o CI e a publicação usam a mesma node-version', () => {
		// Node diferente gera npm diferente e o npm ci quebra com o lock (lição do RD CRM).
		assert.equal(versaoNode('ci.yml'), versaoNode('publish.yml'));
	});
});
