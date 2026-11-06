// Contexto falso do n8n para os testes do node Digisac.
// Ele imita só o que o `execute` e o `listSearch` usam e grava cada requisição HTTP,
// assim os testes conferem o que o node mandaria para o Digisac sem rede e sem n8n.
// Modelo: test/vizard.test.cjs do node Vizard.

// Credencial falsa: a Base URL é fixa para os testes compararem a URL final.
const CREDENCIAL = { baseUrl: 'https://empresa.digisac.app', pdfBaseUrl: '' };

/**
 * Monta o contexto de execução.
 * @param {number} typeVersion versão do node (1 ou 2).
 * @param {Record<string, unknown>} parametros valores por nome de parâmetro.
 * @param {(opcoes: object) => unknown} [respondedor] devolve a resposta da API (ou lança, para simular erro).
 * @returns contexto com `requisicoes`, a lista das chamadas HTTP gravadas.
 */
function criarContexto(typeVersion, parametros = {}, respondedor = () => ({ ok: true })) {
	const requisicoes = [];
	const contexto = {
		requisicoes,
		// Um item de entrada basta: os testes olham a requisição, não o pareamento.
		getInputData: () => [{ json: {} }],
		// O n8n lê o valor salvo; sem valor ele devolve o padrão que o node passou.
		getNodeParameter: (nome, _indice, padrao) =>
			Object.prototype.hasOwnProperty.call(parametros, nome) ? parametros[nome] : padrao,
		// O `getCurrentNodeParameter` do listSearch lê o mesmo mapa.
		getCurrentNodeParameter: (nome) => parametros[nome],
		getNode: () => ({ name: 'Digisac', type: 'digisac', typeVersion }),
		getCredentials: async () => CREDENCIAL,
		continueOnFail: () => false,
		helpers: {
			// Grava a chamada e devolve o que o respondedor mandar; erro do respondedor sobe como na rede.
			httpRequestWithAuthentication: async (tipoCredencial, opcoes) => {
				requisicoes.push({ tipoCredencial, ...opcoes });
				return respondedor(opcoes);
			},
			// Versões simples dos auxiliares do n8n-core, suficientes para a saída do node.
			returnJsonArray: (itens) => itens.map((json) => ({ json })),
			constructExecutionMetaData: (dados, { itemData }) =>
				dados.map((dado) => ({ ...dado, pairedItem: itemData })),
		},
	};
	return contexto;
}

module.exports = { criarContexto };
