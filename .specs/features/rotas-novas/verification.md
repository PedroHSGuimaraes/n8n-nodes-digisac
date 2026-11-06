# rotas-novas verification

**Verdict**: PASS (rejulgado por revisor independente, não pelo autor: os 9 achados da tabela Findings foram conferidos contra `5d658e7`, cada correção com uma mutação que deixa um teste vermelho, e as linhas C3, C20 e C36 a C39, que estavam `no`, foram rejulgadas abaixo)
**Proofs**: `proofs.md` no HEAD final da branch (regerado depois da rodada 2 da the-judge)
**Verifier**: independent sub-agent (author != verifier)

## Checks

| Check | Test | Holds |
| --- | --- | --- |
| C1 | `kanban-catalogo.test.cjs` `K1.01 os 298 IDs antigos continuam iguais` | yes |
| C2 | `kanban-catalogo.test.cjs` `K1.02 os IDs novos vão de e299 a e315 na ordem da coleção` | yes |
| C3 | `kanban-catalogo.test.cjs` `K1.03 reuseIds reaproveita o ID conhecido e numera a rota nova pelo maior ID` | yes - rejulgado: depois de `5d658e7` o teste varia método e pasta. Mutação: trocar `chaveDaRota` por `rawUrl` puro deixa o teste vermelho (rejulgado por revisor independente, não pelo autor) |
| C4 | `kanban-catalogo.test.cjs` `K1.04 as 17 rotas do Kanban têm método e caminho da documentação` | yes |
| C5 | `kanban-catalogo.test.cjs` `K1.05 o gerador põe /api nos PUT do Kanban e não mexe em /v1/cards` | yes |
| C6 | `kanban-catalogo.test.cjs` `K1.06 o build não chama o gerador` | yes |
| C7 | `kanban-operacoes.test.cjs` `K2.01 listar quadros envia a query fixa e o timeout` | yes |
| C8 | `kanban-operacoes.test.cjs` `K2.02 buscar quadro chama o caminho com o ID` | yes |
| C9 | `kanban-operacoes.test.cjs` `K2.03 criar quadro envia só os campos adicionados` | yes |
| C10 | `kanban-operacoes.test.cjs` `K2.04 editar quadro envia só o nome` | yes |
| C11 | `kanban-operacoes.test.cjs` `K2.05 listar colunas monta a query com e sem quadro` | yes |
| C12 | `kanban-operacoes.test.cjs` `K2.06 buscar coluna chama o caminho com a query estática` | yes |
| C13 | `kanban-operacoes.test.cjs` `K2.07 criar coluna envia número e booleano certos` | yes |
| C14 | `kanban-operacoes.test.cjs` `K2.08 editar coluna envia só o nome` | yes |
| C15 | `kanban-operacoes.test.cjs` `K2.09 reordenar coluna envia antes e depois` | yes |
| C16 | `kanban-operacoes.test.cjs` `K2.10 listar cards monta a query com coluna e usuário, só coluna ou nenhum` | yes |
| C17 | `kanban-operacoes.test.cjs` `K2.11 buscar card chama o caminho com o ID` | yes |
| C18 | `kanban-operacoes.test.cjs` `K2.12 criar card envia coluna e chamado` | yes |
| C19 | `kanban-operacoes.test.cjs` `K2.13 editar card envia a posição como número só quando adicionada` | yes |
| C20 | `kanban-operacoes.test.cjs` `K2.14 reordenar card envia os quatro campos` | yes - rejulgado: o teste agora envia os quatro campos, com `afterCardId` (`5d658e7`). Mutação: tirar `afterCardId` de `CARD_BODY_KEYS` deixa o teste vermelho (rejulgado por revisor independente, não pelo autor) |
| C21 | `kanban-operacoes.test.cjs` `K2.15 ID de path vazio lança o erro do campo certo` | yes |
| C22 | `kanban-operacoes.test.cjs` `K2.16 erros do Digisac viram NodeApiError com o código HTTP` | yes |
| C23 | `kanban-apagar.test.cjs` `K3.01 as três operações de apagar têm o campo Confirm Delete` | yes |
| C24 | `kanban-apagar.test.cjs` `K3.02 sem confirmação cada uma das três recusa antes da requisição` | yes |
| C25 | `kanban-apagar.test.cjs` `K3.03 excluir quadro com confirmação envia o DELETE` | yes |
| C26 | `kanban-apagar.test.cjs` `K3.04 excluir coluna com confirmação envia a coluna de destino` | yes |
| C27 | `kanban-apagar.test.cjs` `K3.05 excluir card com confirmação envia o DELETE` | yes |
| C28 | `kanban-apagar.test.cjs` `K3.06 as outras DELETE do catálogo não pedem confirmação` | yes |
| C29 | `kanban-seletores.test.cjs` `K4.01 quadro, coluna e card viram resourceLocator na versão 2` | yes |
| C30 | `kanban-seletores.test.cjs` `K4.02 a lista de quadros chama a rota e filtra no node` | yes |
| C31 | `kanban-seletores.test.cjs` `K4.03 a lista de colunas filtra pelo quadro do campo auxiliar` | yes |
| C32 | `kanban-seletores.test.cjs` `K4.04 a lista de cards exige a coluna do campo auxiliar` | yes |
| C33 | `kanban-seletores.test.cjs` `K4.05 os campos auxiliares existem só na versão 2 e não saem na requisição` | yes |
| C34 | `kanban-seletores.test.cjs` `K4.06 o 401 do Digisac nas três listas vira NodeApiError` | yes |
| C35 | `kanban-seletores.test.cjs` `K4.07 a versão 2 lê list e id e tira o espaço das pontas` | yes |
| C36 | `kanban-docs.test.cjs` `K5.01 a versão 1 vê as operações novas com campos de texto` | yes - rejulgado: a segunda prova passou a ser `versao1.test.cjs` S2.03 (`5d658e7`). Conferi por conta própria com o build de `origin/main` e o do PR: 854 de 856 propriedades idênticas; as duas que mudam só crescem (a lista `resource` ganha `general_kanban` e o `useRawBodyJson` ganha 9 IDs de operação). A conta do autor, "589 de 590", não reproduziu, mas a conclusão vale (rejulgado por revisor independente, não pelo autor) |
| C37 | `kanban-docs.test.cjs` `K5.02 a versão do pacote e o changelog dizem 1.2.0` | yes - rejulgado: o teste lê só a seção 1.2.0 e exige `17 operações`, `e299` e `Confirm Delete` (`5d658e7`); a rodada 2 acrescentou a suposição do `/api` e do `position` (K6.02). Limite: a frase "IDs de operação estáveis" não é travada, só o `e299` (rejulgado por revisor independente, não pelo autor) |
| C38 | `kanban-docs.test.cjs` `K5.03 o README documenta o Kanban` | yes - rejulgado: o teste lê cada seção (`5d658e7`). Mutações: renomear o título `Excluir card com confirmação` e trocar `Kanban como tool` deixam o teste vermelho (rejulgado por revisor independente, não pelo autor) |
| C39 | `kanban-docs.test.cjs` `K5.04 a documentação gerada lista 315 chamadas` | yes - rejulgado: o teste lê a linha `Total de chamadas documentadas: 315` (`5d658e7`). Mutação: trocar por 314 deixa o teste vermelho (rejulgado por revisor independente, não pelo autor) |
| C40 | `npm test` resumo `ℹ fail 0` e as três linhas `Build` de `proofs.md` (lint, tsc, build) | yes |
| C41 | `kanban-apagar.test.cjs` `K6.01 o Kanban recusa . e .. como ID` | yes - escrito pelo revisor na rodada 2 (achado F2 da the-judge); visto vermelho antes e verde depois. Cobre as 17 operações, `.` e `..`, nas versões 1 e 2. Mutação: trocar a condição da guarda por `false` deixa o teste vermelho. O teste irmão prova que uma operação antiga segue enviando `..` como antes (julgado por revisor independente, não pelo autor) |
| C42 | `kanban-docs.test.cjs` `K6.02 README e CHANGELOG avisam as suposições` | yes - escrito pelo revisor na rodada 2 (achados F1 e F3); visto vermelho antes e verde depois. Lê a seção Kanban do README e a seção 1.2.0 do CHANGELOG (julgado por revisor independente, não pelo autor) |

## Findings

| Finding | Evidence | Fix | Closed |
| --- | --- | --- | --- |
| C3 não isola método nem pasta na chave de `reuseIds` | `kanban-catalogo.test.cjs` K1.03: `chave(n)` fixa `method: 'GET'` e deriva `rawUrl` e `sourcePath` de `n`. Mutação rodada: `chaveDaRota` trocada por `rawUrl` puro, K1.03 continua verde, e `DELETE u` com anterior `GET u` herda `e001` (o original dá `e002`) | acrescentar casos com mesma URL e método diferente, e mesma URL e método com pasta diferente, esperando ID novo | 5d658e7 - C3 (K1.03 ganhou método e pasta) |
| C20 diz quatro campos e o teste envia três | `kanban-operacoes.test.cjs` K2.14: `bodyFields_e315_fields` sem `afterCardId`; `deepEqual` do body com três chaves | incluir `afterCardId` no body do teste e na asserção | 5d658e7 - C20 (K2.14 envia afterCardId) |
| C36 aponta K5.01, que não afirma o `name` e o `type` das 298 antigas | `kanban-docs.test.cjs` K5.01 só confere a lista de `operation` do Kanban e que os campos do Kanban não são `resourceLocator`. `versao1.test.cjs` S2.03 faz a comparação, mas agora remove e299-e315 das listas `operation` antes de comparar | apontar a prova de C36 também para S2.03, ou afirmar em K5.01 que as propriedades antigas são idênticas às da 1.1.0 | 5d658e7 - C36 (segunda prova S2.03) |
| C37 aceita changelog sem as três afirmações do critério | `kanban-docs.test.cjs` K5.02: `assert.match(changelog, /Kanban/)` sobre o arquivo todo | restringir à seção `## 1.2.0` e conferir `e299`/`e315` ou "17", ID estável e `Confirm Delete` | 5d658e7 - C37 (K5.02 lê só a seção 1.2.0) |
| C38 aceita README sem o exemplo de apagar nem a seção de Tool | `kanban-docs.test.cjs` K5.03: `/Confirm Delete/` e `/Tool de Agente de IA/Tool de IA/` em qualquer ponto; o regex `mover.*card` casa em uma linha qualquer | afirmar o título do exemplo de apagar (README linha 272) e o trecho "Kanban como tool" (linha 378) | 5d658e7 - C38 (K5.03 lê cada seção) |
| C39 aceita `docs/api-calls.md` com o total errado | `kanban-docs.test.cjs` K5.04: `/315/` casa com `e315` na linha 460; o README (linha 18 "315 chamadas em 52 recursos", linha 140 "Kanban (General) / 17") não é lido | afirmar `Total de chamadas documentadas: 315` e a linha `Kanban (General) / 17` do README | 5d658e7 - C39 (K5.04 lê a linha de total) |
| Amostragem menor que o critério em C22, C28 e C33 | C22 roda 5 das 17 operações (uma por método); C28 roda a recusa em 1 das 26 `DELETE` antigas, só na versão 1 (as propriedades são conferidas em todas); C33 afirma a ausência de `filterColumn_` só em e299-e304 e e306, não em e305, e307-e310 e e312. Rodei o `execute` das 298 antigas nas versões 1 e 2 contra o `dist` de `origin/main` e dá 0 diferença em 596 | ampliar os laços para as 17 operações, para as 26 `DELETE` na versão 2 e para a ausência de `filterColumn_` nas operações sem card | 5d658e7 - C22 (17 operações), C28 (26 DELETE, v1 e v2), C33 (ausência em e305 e outras) |
| Filtro de usuário só com espaços vai ao Digisac | Exemplo próprio: `query_e310_userId: '  '` com a coluna `c1` dá `{"where":{"columnId":"c1"},"paginate":false,"withTotal":false,"customFilter":{"includeUnassigned":true,"userIds":["  "]}}`. `buildComplexQueryValue` (`actions/index.ts`) só descarta `''`; o locator é aparado por `plainValue`, o texto não. Mesmo caso com coluna `'   '` na versão 1 | aparar o texto antes de comparar com `''` no Kanban (ou afirmar que a versão 1 mantém o espaço como a 1.0.3) e acrescentar o teste | 5d658e7 - K2.10b e trim no Kanban |
| Item da lista sem `id` vira valor `'undefined'`, e item `null` derruba a lista | Exemplo próprio contra `searchKanbanBoards`: `{data:[{name:'Sem id'}]}` devolve `{name:'Sem id', value:'undefined'}`; `{data:[null]}` lança `TypeError: Cannot read properties of null (reading 'data')` em `labelOf`. Hoje a forma da resposta é suposição não confirmada do plano | descartar itens sem `id` nas três listas do Kanban e cobrir com um teste | 5d658e7 - K4.02b e filtro de id |

## Sondagem própria

Rodada contra o `dist` (igual à compilação de `HEAD`, conferido por `tsc` em cópia) com testes descartáveis fora do repositório.

- **Query com espaços, aspas e barra**: `kanbanQueryFromTemplate` com `a"b\c/d` e `u"1` devolve JSON válido (`JSON.parse` passa). Coluna `'   '` fica no `where` (achado acima).
- **`reuseIds` com rota removida**: catálogo anterior `e001`-`e003`, coleção sem `e003` e com rota nova: a nova recebe `e004`, o ID removido não é reaproveitado. Catálogo anterior vazio ou ID malformado: numera `e001`.
- **Confirmação de apagar**: `'true'`, `1`, `'on'`, `undefined` e `null` recusam e gravam 0 requisições (o gate `!== true` é estrito). Dois itens de entrada com a confirmação ligada: 2 `DELETE`, uma por item.
- **Listas vazias**: `{data: []}`, `[]`, `null`, `undefined` e texto devolvem `{results: []}`. Item sem `id` e item `null`: ver achado.
- **`position`**: `0` e `-1` vão no body; `''` e ausente não vão.
- **Dois itens com a primeira falhando**: sem `continueOnFail`, o `execute` lança na primeira e grava 1 requisição. Com `continueOnFail`, devolve o erro no item 0 e a resposta do item 1 com `pairedItem` certo.
- **ID de path `a/b?x=1`**: vai codificado (`a%2Fb%3Fx%3D1`). ID `..` vai literal no caminho; vale para todo o catálogo, sem relação com esta mudança.
- **Versão 1 das 298 antigas**: com o `dist` de `origin/main` compilado em cópia, as propriedades antigas são idênticas às novas (só difere a lista de recursos, que ganha o Kanban e muda a contagem de chamadas na descrição) e o `execute` de cada uma das 298, nas versões 1 e 2, grava a mesma requisição (método, URL, query, body, timeout): 596 comparações, 0 diferença. O diff de `actions/index.ts` e `helpers/resourceLocator.ts` só atua com `isKanbanEndpoint` e `isKanbanOperation`; as chaves `boardId`, `columnId` e `cardId` de `LISTED_ID_TYPES` não existem como path nem como body em nenhuma operação antiga. A fixture `ids-1.1.0.json` confere com o `endpoints.ts` de `origin/main` (298 entradas, id, método e URL idênticos).
- **Observações sem achado**: K2.06 fixa `include[]` com só o último valor (`cards.ticket.contact`), o que o plano declara fora de escopo. `proofs.md` registra `HEAD` 49a4e17; entre 49a4e17 e 16a27d6 só mudam `checks.md` e `proofs.md`.
