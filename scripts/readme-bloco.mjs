/**
 * Troca só o bloco gerado do README, entre dois marcadores.
 *
 * Por que existe (AD-009): o README agora é escrito à mão no padrão completo. O `generate:docs`
 * antes sobrescrevia o arquivo inteiro e apagaria esse texto na primeira execução. Agora ele só
 * regrava a tabela de recursos que fica entre os marcadores.
 */

/** Marcador que abre o bloco gerado (comentário HTML: não aparece na página). */
export const MARCADOR_INICIO = '<!-- digisac:recursos:start -->';
/** Marcador que fecha o bloco gerado. */
export const MARCADOR_FIM = '<!-- digisac:recursos:end -->';

/**
 * Devolve o README com o conteúdo entre os marcadores trocado por `bloco`.
 * Sem os dois marcadores, lança erro: melhor parar do que sobrescrever texto escrito à mão.
 */
export function substituirBloco(texto, bloco) {
	const inicio = texto.indexOf(MARCADOR_INICIO);
	const fim = texto.indexOf(MARCADOR_FIM);
	if (inicio === -1 || fim === -1 || fim < inicio) {
		throw new Error(`README sem os marcadores ${MARCADOR_INICIO} e ${MARCADOR_FIM}`);
	}
	return `${texto.slice(0, inicio + MARCADOR_INICIO.length)}\n${bloco}\n${texto.slice(fim)}`;
}
