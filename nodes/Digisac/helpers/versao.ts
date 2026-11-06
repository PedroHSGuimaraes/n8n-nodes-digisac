/**
 * Prende propriedades a faixas de versão do node (`@version`).
 *
 * Fica em arquivo próprio porque dois módulos precisam disto (IDs guiados e valores guiados) e um
 * importar o outro criaria um ciclo. A regra é a mesma do plano (AD-002): a cópia em texto vale
 * só para a versão 1 e a cópia guiada vale da versão 2 em diante, com o mesmo `name`.
 */
import type { DisplayCondition, IDisplayOptions } from 'n8n-workflow';

/** Faixa de `@version` aceita pelo n8n: números exatos ou condições como `{ _cnd: { gte: 2 } }`. */
export type VersionRange = Array<number | DisplayCondition>;

/** A cópia guiada aparece da versão 2 em diante. */
export const FROM_VERSION_2: VersionRange = [{ _cnd: { gte: 2 } }];

/** Copia as regras de exibição do campo e prende o campo à faixa de versões. */
export function withVersion(
	displayOptions: IDisplayOptions | undefined,
	versions: VersionRange,
): IDisplayOptions {
	return { ...displayOptions, show: { ...displayOptions?.show, '@version': versions } };
}
