// Testes da fatia S3: IDs guiados (Resource Locator) na versão 2 do node.
// Cada teste nasce de um critério do plano; se um quebra, a versão 2 deixou de guiar o ID
// ou, pior, mandou ao Digisac um ID diferente do que a pessoa escolheu.
const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const { Digisac } = require('../dist/nodes/Digisac/Digisac.node');
const { DIGISAC_ENDPOINTS } = require('../dist/nodes/Digisac/generated/endpoints');
const { criarContexto } = require('./contexto.cjs');

// Os 8 tipos de ID com lista pesquisável (AD-006) e o método do listSearch de cada um.
const TIPOS_COM_LISTA = {
	contactId: 'searchContacts',
	serviceId: 'searchServices',
	departmentId: 'searchDepartments',
	userId: 'searchUsers',
	tagId: 'searchTags',
	roleId: 'searchRoles',
	botId: 'searchBots',
	ticketTopicId: 'searchTicketTopics',
};

// Parâmetros mínimos de e001 (POST /api/v1/bots/{botId}/trigger-signal/{contactId}).
const baseE001 = { operation: 'e001', queryKey_e001_flag: 'flagAqui' };

const propriedades = new Digisac().description.properties;

// Diz se a propriedade aparece na versão 2: sem condição de versão, ou com `gte` até 2.
function visivelNaV2(propriedade) {
	const condicao = propriedade.displayOptions?.show?.['@version'];
	if (condicao === undefined) return true;
	return condicao.some(
		(c) => c === 2 || (typeof c === 'object' && c._cnd?.gte !== undefined && c._cnd.gte <= 2),
	);
}
// Procura a cópia da versão 2 de um parâmetro pelo name.
const copiaV2 = (nome) => propriedades.filter((p) => p.name === nome && visivelNaV2(p));

// Roda o execute da versão 2 e devolve a requisição gravada.
async function executarV2(parametros) {
	const contexto = criarContexto(2, { ...baseE001, ...parametros });
	await new Digisac().execute.call(contexto);
	return contexto.requisicoes[0];
}

describe('IDs guiados na versão 2', () => {
	it('S3.01 o node nasce na versão 2 e mantém a 1', () => {
		const descricao = new Digisac().description;
		assert.deepEqual(descricao.version, [1, 2]);
		assert.equal(descricao.defaultVersion, 2);
	});

	it('S3.02a os 8 tipos de path viram resourceLocator com lista e id', () => {
		for (const [tipo, metodo] of Object.entries(TIPOS_COM_LISTA)) {
			const operacoes = DIGISAC_ENDPOINTS.filter((e) => e.pathParams.includes(tipo));
			assert.ok(operacoes.length > 0, `o catálogo não usa ${tipo}`);
			for (const operacao of operacoes) {
				const copias = copiaV2(`path_${operacao.id}_${tipo}`);
				assert.equal(copias.length, 1, `${operacao.id}/${tipo}: esperava 1 cópia na v2`);
				const [campo] = copias;
				assert.equal(campo.type, 'resourceLocator');
				assert.deepEqual(
					campo.modes.map((m) => m.name),
					['list', 'id'],
				);
				assert.equal(campo.modes[0].typeOptions.searchable, true);
				assert.equal(campo.modes[0].typeOptions.searchListMethod, metodo);
				assert.equal(campo.default.mode, 'list');
			}
		}
	});

	it('S3.02b query e body de contato, serviço, departamento e usuário viram resourceLocator', () => {
		// Filtros de query: queryKey_<op>_[where_]<tipo>Id.
		const padrao = /^queryKey_e\d+_(?:where_)?(service|department|user|contact)Id_?$/;
		const consultas = propriedades.filter((p) => padrao.test(p.name));
		const nomes = [...new Set(consultas.map((p) => p.name))];
		assert.equal(nomes.length, 35, 'o catálogo tem 35 filtros de ID na query');
		for (const nome of nomes) {
			const [campo] = copiaV2(nome);
			assert.equal(campo.type, 'resourceLocator', nome);
			assert.deepEqual(
				campo.modes.map((m) => m.name),
				['list', 'id'],
				nome,
			);
			// O método de busca tem de ser o do tipo do campo (departmentId não pode apontar para usuários).
			const tipo = padrao.exec(nome)[1] + 'Id';
			assert.equal(campo.modes[0].typeOptions.searchListMethod, TIPOS_COM_LISTA[tipo], nome);
		}
		// Chaves de ID dentro dos Campos do Body (coleções bodyFields_<op>_fields).
		const idsDoBody = /^(contactId|userId|serviceId|departmentId)$/;
		const colecoes = [
			...new Set(propriedades.filter((p) => p.name.startsWith('bodyFields_')).map((p) => p.name)),
		];
		let comId = 0;
		for (const nome of colecoes) {
			const [colecao] = copiaV2(nome);
			const filhosId = colecao.options.filter((o) => idsDoBody.test(o.name));
			if (filhosId.length === 0) continue;
			comId += 1;
			for (const filho of filhosId) {
				assert.equal(filho.type, 'resourceLocator', `${nome}.${filho.name}`);
				assert.equal(
					filho.modes[0].typeOptions.searchListMethod,
					TIPOS_COM_LISTA[filho.name],
					`${nome}.${filho.name}`,
				);
			}
		}
		assert.equal(comId, 38, 'o catálogo tem 38 coleções de body com ID');
	});

	it('S3.03 os 24 tipos restantes de path viram resourceLocator só com id', () => {
		const tipos = new Set(DIGISAC_ENDPOINTS.flatMap((e) => e.pathParams));
		// Quadro, coluna e card do Kanban têm lista própria (ver kanban-seletores.test.cjs).
		const tiposKanban = new Set(['boardId', 'columnId', 'cardId']);
		const restantes = [...tipos].filter((t) => !(t in TIPOS_COM_LISTA) && !tiposKanban.has(t));
		assert.equal(restantes.length, 24);
		for (const tipo of restantes) {
			for (const operacao of DIGISAC_ENDPOINTS.filter((e) => e.pathParams.includes(tipo))) {
				const [campo] = copiaV2(`path_${operacao.id}_${tipo}`);
				assert.equal(campo.type, 'resourceLocator', `${operacao.id}/${tipo}`);
				assert.deepEqual(
					campo.modes.map((m) => m.name),
					['id'],
					`${operacao.id}/${tipo}`,
				);
			}
		}
	});

	it('S3.04 v2 lê list e id e remove o espaço das pontas', async () => {
		const req = await executarV2({
			path_e001_contactId: { mode: 'list', value: 'c1' },
			path_e001_botId: { mode: 'id', value: ' b1 ' },
		});
		assert.equal(req.method, 'POST');
		assert.equal(req.url, '/api/v1/bots/b1/trigger-signal/c1');
	});

	it('S3.05 v2 vazio lança erro com a descrição do que fazer', async () => {
		await assert.rejects(
			executarV2({
				path_e001_contactId: { mode: 'list', value: '' },
				path_e001_botId: { mode: 'id', value: 'b1' },
			}),
			(erro) => {
				assert.equal(erro.message, "The 'Contact Id' parameter is empty [item 0]");
				assert.equal(erro.description, 'Choose a contact from the list or paste its ID');
				return true;
			},
		);
	});

	it('S3.06 all na query de departamento da v2 vai como all', async () => {
		const req = await executarV2({
			operation: 'e100',
			queryKey_e100_departmentId: { mode: 'id', value: 'all' },
		});
		assert.equal(req.qs.departmentId, 'all');
	});

	it('S3.14 ID de path em texto na v2 perde o espaço e número vale', async () => {
		const comEspaco = await executarV2({ path_e001_contactId: ' c1 ', path_e001_botId: 'b1' });
		assert.equal(comEspaco.url, '/api/v1/bots/b1/trigger-signal/c1');
		const numero = await executarV2({ path_e001_contactId: 123, path_e001_botId: 'b1' });
		assert.equal(numero.url, '/api/v1/bots/b1/trigger-signal/123');
	});

	it('S3.15 cópias da v2 ficam invisíveis na v1', () => {
		// Agrupa por nome + onde aparece (sem @version): cada grupo com cópia por versão tem 1 por versão.
		const grupos = new Map();
		for (const p of propriedades) {
			const { '@version': _versao, ...onde } = p.displayOptions?.show ?? {};
			const chave = `${p.name}|${JSON.stringify(onde)}`;
			grupos.set(chave, [...(grupos.get(chave) ?? []), p]);
		}
		const visivelNaV1 = (p) => {
			const cond = p.displayOptions?.show?.['@version'];
			return cond === undefined || cond.includes(1);
		};
		let pares = 0;
		for (const [chave, lista] of grupos) {
			if (!lista.some((p) => p.displayOptions?.show?.['@version'])) continue;
			// Campo auxiliar do Kanban (filterBoard_/filterColumn_) existe só na versão 2, sem par na 1;
			// o teste K4.05 prova que ele fica oculto na v1.
			if (lista.length === 1 && !visivelNaV1(lista[0])) continue;
			pares += 1;
			assert.equal(lista.filter(visivelNaV1).length, 1, `${chave}: deve ter 1 cópia na v1`);
			assert.equal(lista.filter(visivelNaV2).length, 1, `${chave}: deve ter 1 cópia na v2`);
		}
		assert.ok(pares > 250, `esperava mais de 250 pares, achou ${pares}`);
	});

	it('S3.11 v2 aceita texto de workflow migrado à mão', async () => {
		const req = await executarV2({ path_e001_contactId: 'c1', path_e001_botId: 'b1' });
		assert.equal(req.url, '/api/v1/bots/b1/trigger-signal/c1');
	});
});

describe('listSearch dos IDs', () => {
	const listSearch = new Digisac().methods?.listSearch;
	// Roda um método do listSearch com resposta fixa e devolve resultado e requisições.
	async function buscar(metodo, filtro, token, respondedor) {
		const contexto = criarContexto(2, {}, respondedor);
		const resultado = await listSearch[metodo].call(contexto, filtro, token);
		return { resultado, requisicoes: contexto.requisicoes };
	}
	const itens = (quantidade) =>
		Array.from({ length: quantidade }, (_, i) => ({ id: `id${i}`, name: `Item ${i}` }));

	it('S3.07 busca de contatos usa $iLike em número, nome ou nada', async () => {
		const resposta = () => ({ data: [{ id: 'c1', name: 'Ana', data: { number: '5511' } }] });
		const porNumero = await buscar('searchContacts', '5511', undefined, resposta);
		const [req] = porNumero.requisicoes;
		assert.equal(req.method, 'GET');
		assert.equal(req.url, '/api/v1/contacts');
		assert.equal(req.qs.perPage, 50);
		assert.equal(req.qs.page, 1);
		assert.equal(req.qs['where[data.number][$iLike]'], '%5511%');
		assert.deepEqual(porNumero.resultado.results, [{ name: 'Ana', value: 'c1' }]);

		const porNome = await buscar('searchContacts', 'ana', undefined, resposta);
		assert.equal(porNome.requisicoes[0].qs['where[name][$iLike]'], '%ana%');

		const semTexto = await buscar('searchContacts', '', undefined, resposta);
		assert.deepEqual(
			Object.keys(semTexto.requisicoes[0].qs).sort(),
			['page', 'perPage'],
			'texto vazio não manda filtro',
		);
	});

	it('S3.08 listas dos 7 tipos usam a rota certa e filtram no node', async () => {
		const rotas = {
			searchServices: '/api/v1/services',
			searchDepartments: '/api/v1/departments',
			searchUsers: '/api/v1/users',
			searchTags: '/api/v1/tags',
			searchRoles: '/api/v1/roles',
			searchBots: '/api/v1/bots',
			searchTicketTopics: '/api/v1/ticket-topics',
		};
		const resposta = () => ({
			data: [
				{ id: '1', name: 'Vendas' },
				{ id: '2', name: 'Suporte Técnico' },
			],
		});
		for (const [metodo, rota] of Object.entries(rotas)) {
			const { resultado, requisicoes } = await buscar(metodo, 'TECNICO', undefined, resposta);
			assert.equal(requisicoes.length, 1, metodo);
			assert.equal(requisicoes[0].url, rota, metodo);
			assert.equal(requisicoes[0].qs.perPage, 50, metodo);
			// Sem acento e sem diferenciar maiúscula: "TECNICO" acha "Suporte Técnico".
			assert.deepEqual(resultado.results, [{ name: 'Suporte Técnico', value: '2' }], metodo);
		}
	});

	it('S3.09 paginação devolve token só com página cheia e pede uma página por vez', async () => {
		const cheia = await buscar('searchTags', undefined, undefined, () => ({ data: itens(50) }));
		assert.equal(cheia.resultado.paginationToken, '2');
		assert.equal(cheia.requisicoes.length, 1);

		const curta = await buscar('searchTags', undefined, undefined, () => ({ data: itens(12) }));
		assert.equal(curta.resultado.paginationToken, undefined);
		// Um item a menos que a página cheia é a última página: sem token.
		const quaseCheia = await buscar('searchTags', undefined, undefined, () => ({
			data: itens(49),
		}));
		assert.equal(quaseCheia.resultado.paginationToken, undefined);

		const segunda = await buscar('searchTags', undefined, '2', () => ({ data: itens(50) }));
		assert.equal(segunda.requisicoes[0].qs.page, 2);
		assert.equal(segunda.resultado.paginationToken, '3');
	});

	it('S3.10 401 na lista vira NodeApiError com o código', async () => {
		const falha = () => {
			throw Object.assign(new Error('Unauthorized'), { httpCode: '401', statusCode: 401 });
		};
		await assert.rejects(buscar('searchUsers', undefined, undefined, falha), (erro) => {
			assert.equal(erro.name, 'NodeApiError');
			assert.equal(String(erro.httpCode), '401');
			return true;
		});
	});
	it('S3.12 busca de contato limpa o + e escapa % e _', async () => {
		const resposta = () => ({ data: [] });
		const telefone = await buscar('searchContacts', '+55 (11) 9999-8888', undefined, resposta);
		// O + e a pontuação saem: o número guardado no Digisac não os tem.
		assert.equal(telefone.requisicoes[0].qs['where[data.number][$iLike]'], '%551199998888%');
		const misto = await buscar('searchContacts', 'ana 5511', undefined, resposta);
		assert.equal(misto.requisicoes[0].qs['where[name][$iLike]'], '%ana 5511%');
		// % e _ do usuário são texto, não curinga do ILIKE.
		const curinga = await buscar('searchContacts', '100%_x', undefined, resposta);
		assert.equal(curinga.requisicoes[0].qs['where[name][$iLike]'], '%100\\%\\_x%');
	});

	it('S3.13 página cheia sem acerto no filtro do node ainda devolve token', async () => {
		// Limite aceito (plano, Assumptions): o filtro vale para a página baixada; a pessoa rola para a próxima.
		const { resultado } = await buscar('searchTags', 'zzz', undefined, () => ({ data: itens(50) }));
		assert.deepEqual(resultado.results, []);
		assert.equal(resultado.paginationToken, '2');
	});
});
