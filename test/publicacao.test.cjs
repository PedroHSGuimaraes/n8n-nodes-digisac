// Testes da fatia S5: documentação e lançamento 1.1.0 do pacote.
// Eles guardam o que o dono pediu: README no padrão completo, funding, CHANGELOG,
// geração de documentos que não apaga o README e publicação por stage com aprovação por 2FA.
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { copyFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { describe, it } = require('node:test');

// Raiz do repositório e leitura de texto, como em estrutura.test.cjs.
const raiz = path.resolve(__dirname, '..');
const ler = (...partes) => readFileSync(path.join(raiz, ...partes), 'utf8');
const pacote = JSON.parse(ler('package.json'));

describe('documentação e lançamento', () => {
	it('S5.01 versão 1.1.0, funding do dono e seção no CHANGELOG', () => {
		assert.equal(pacote.version, '1.1.0');
		assert.deepEqual(pacote.funding, {
			type: 'individual',
			url: 'https://buymeacoffee.com/qTny0AzFXS',
		});
		const changelog = ler('CHANGELOG.md');
		assert.match(changelog, /^## 1\.1\.0/m);
		// A seção precisa contar as três mudanças prometidas no plano.
		const secao = changelog.split(/^## /m).find((bloco) => bloco.startsWith('1.1.0'));
		for (const assunto of [/node-cli/i, /vers[aã]o 2/i, /lint/i]) {
			assert.match(secao, assunto);
		}
	});

	it('S5.02 README tem as seções do padrão completo e não tem Trigger', () => {
		const readme = ler('README.md');
		// Cada seção do padrão do RD CRM; o emoji do título é opcional no teste.
		const secoes = [
			'Funcionalidades',
			'Instalação',
			'Credenciais',
			'Nós e Operações',
			'Usar como Tool de Agente de IA',
			'Exemplos',
			'Desenvolvimento',
			'Compatibilidade',
			'Recursos',
			'Publicação',
			'Versões',
			'Suporte',
			'Apoie o projeto',
			'Licença',
		];
		for (const secao of secoes) {
			assert.match(
				readme,
				new RegExp(`^##\\s+(?:\\S+\\s+)?${secao}`, 'm'),
				`falta a seção ${secao}`,
			);
		}
		// Selo de apoio e índice de links no topo.
		assert.match(readme, /img\.shields\.io\/badge\/Buy_Me_a_Coffee/);
		assert.match(readme, /\[Instalação\]\(#/);
		// O pacote não tem trigger; seção de Trigger seria documentação falsa.
		assert.doesNotMatch(readme, /^##\s+(?:\S+\s+)?Trigger/m);
	});

	it('S5.03 generate:docs troca só o bloco entre marcadores', async () => {
		const { substituirBloco, MARCADOR_INICIO, MARCADOR_FIM } = await import(
			'../scripts/readme-bloco.mjs'
		);
		const antes = `# Título\n\ntexto manual\n\n${MARCADOR_INICIO}\nvelho\n${MARCADOR_FIM}\n\nrodapé manual\n`;
		const depois = substituirBloco(antes, 'novo');
		assert.equal(
			depois,
			`# Título\n\ntexto manual\n\n${MARCADOR_INICIO}\nnovo\n${MARCADOR_FIM}\n\nrodapé manual\n`,
		);
		// Sem marcadores, o script para em vez de sobrescrever o README inteiro.
		assert.throws(() => substituirBloco('# sem marcadores\n', 'novo'), /marcador/i);
		// O README real tem os marcadores.
		assert.ok(ler('README.md').includes(MARCADOR_INICIO));
	});

	it('S5.03b generate:docs roda sem apagar o texto manual do README', () => {
		// Copia o catálogo e um README de teste para uma pasta temporária e roda o script de verdade.
		const tmp = mkdtempSync(path.join(tmpdir(), 'digisac-docs-'));
		mkdirSync(path.join(tmp, 'nodes', 'Digisac', 'generated'), { recursive: true });
		copyFileSync(
			path.join(raiz, 'nodes', 'Digisac', 'generated', 'endpoints.ts'),
			path.join(tmp, 'nodes', 'Digisac', 'generated', 'endpoints.ts'),
		);
		const manual =
			'# Meu README\n\ntexto manual\n\n<!-- digisac:recursos:start -->\nvelho\n<!-- digisac:recursos:end -->\n\nrodapé manual\n';
		writeFileSync(path.join(tmp, 'README.md'), manual);
		execFileSync('node', [path.join(raiz, 'scripts', 'generate-docs.mjs')], { cwd: tmp });
		const depois = readFileSync(path.join(tmp, 'README.md'), 'utf8');
		assert.ok(depois.startsWith('# Meu README\n\ntexto manual\n'));
		assert.ok(depois.endsWith('\nrodapé manual\n'));
		assert.ok(!depois.includes('velho'));
		assert.match(depois, /\| Contatos \(General\) \| 22 \|/);
	});

	it('S5.04 publish.yml usa o stage do npm 12.2.2 com provenance', () => {
		const publicar = ler('.github', 'workflows', 'publish.yml');
		assert.match(publicar, /npx -y npm@12\.2\.2 stage publish --provenance --access public/);
		assert.match(publicar, /RELEASE_MODE:\s*'true'/);
		assert.match(publicar, /workflow_dispatch:/);
		// Os passos de qualidade rodam antes do stage: o stage precisa ser o último comando.
		const indiceStage = publicar.indexOf('stage publish');
		for (const comando of [
			'npm ci',
			'Validate release tag',
			'npm run lint',
			'npm test',
			'npm run build',
		]) {
			const indice = publicar.indexOf(comando);
			assert.ok(indice >= 0 && indice < indiceStage, `${comando} precisa vir antes do stage`);
		}
	});

	it('S5.06 o pacote mantém o nome n8n-nodes-digisac', () => {
		// Renomear quebraria a instalação de quem já usa a 1.0.3 (porta do nome no Landing).
		assert.equal(pacote.name, 'n8n-nodes-digisac');
	});
});
