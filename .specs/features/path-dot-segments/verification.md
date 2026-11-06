# Digisac 1.2.1: recusar . e .. em todo parâmetro de caminho verification

**Verdict**: PASS (rejulgado por revisor independente, não pelo autor: os 2 achados abaixo foram conferidos contra `177e828`, e a linha C1, que estava `no`, foi rejulgada)
**Proofs**: `proofs.md` no HEAD final da branch (regerado depois da revisão da the-judge)
**Verifier**: independent sub-agent (author != verifier)

## Checks

| Check | Test | Holds |
| --- | --- | --- |
| C1 | `path-ponto.test.cjs` `P1.01 toda operação com parâmetro de caminho recusa . e ..` | yes - rejulgado: depois de `177e828` o teste roda um caso por parâmetro, com `.` ou `..` só nele e `ok` nos outros. Mutações do revisor: olhar só o primeiro parâmetro (`slice(0, 1)`), recusar só `..` e recusar só `.` deixam o teste vermelho. Conferi por execução que as 137 operações recusam `.` e `..` nas versões 1 e 2: 548 de 548 recusas, 0 requisições (rejulgado por revisor independente, não pelo autor) |
| C2 | `path-ponto.test.cjs` `P1.02 ID normal, com ponto no meio e numérico seguem iguais` | yes - recusar `a.b` na cópia faz o P1.02 falhar; compara método e URL exata com `encodeURIComponent` em uma operação por método mais as 17 do Kanban, nas versões 1 e 2. O revisor foi além da amostra: compilou `origin/main` e o PR e comparou as 137 operações com 7 valores (`x1`, `a.b`, `...`, `123`, `.a`, `a.`, `1.5`) nas duas versões, 1918 execuções, 0 diferença (julgado por revisor independente, não pelo autor) |
| C3 | `path-ponto.test.cjs` `P1.03 nenhum ID de operação nem parâmetro de caminho muda` | yes - método, URL crua e nome de cada campo; o "tipo" do plano não é afirmado (ver achado 2) |
| C4 | `kanban-apagar.test.cjs` `K6.01 o Kanban recusa . e .. como ID` | yes - falha quando a checagem perde `.`, perde `..` ou vale só na versão 2 |
| C5 | `path-ponto.test.cjs` `P1.04 versão 1.2.1 e changelog dizem que a recusa é nova` | yes - afirma a versão exata, a seção `## 1.2.1`, `.`, `..`, "recusa nova" e 137 |
| C6 | `npm test` (`ℹ fail 0`, 93 pass) e build/tsc/lint em `proofs.md` | yes - código de saída 0 em todas as linhas de `proofs.md` |

## Findings

| Finding | Evidence | Fix | Closed |
| --- | --- | --- | --- |
| 1. C1 não prova o segundo parâmetro de `e001` | Mutação em cópia (`Object.entries(values).slice(0,1).find(...)`): `ℹ fail 0`. A sonda mostra que o código de HEAD está certo (`e001` com só `contactId=..` lança `Contact Id is not valid`, 0 requisições, v1 e v2), mas nenhum teste falha se a regra voltar a olhar só o primeiro | em P1.01, para operação com 2+ parâmetros, rodar também um caso por parâmetro (`..` só nele, os outros com `ok`) e assertar o erro e 0 requisições | 177e828 - P1.01 por parâmetro, P1.03 confere o tipo (hash corrigido pela revisão: o `41aec86` original não está na branch) |
| 2. P1.03 mais frouxo que o C3 | O C3 diz "nome, tipo ou ID"; `test/path-ponto.test.cjs` P1.03 só confere `method rawUrl` e `includes(path_<id>_<param>)` nos `description.properties`, nunca o `type` do campo. Baixo risco: o diff não toca `generated/` nem `pathParameterProperties` | assertar o `type` (`string` na v1 e `resourceLocator` onde existir) do campo, ou trocar "tipo" por "nome" no C3 | 177e828 - P1.01 por parâmetro, P1.03 confere o tipo (hash corrigido pela revisão) |

## Sondas e mutações (descartáveis, fora do repo)

- **Mutações** (cópia de HEAD no scratchpad, rebuild a cada uma): só `..` falha (P1.01 e K6.01); só `.` falha (idem); Kanban apenas falha o P1.01; só v2 falha P1.01 e K6.01; só `DELETE` falha P1.01 e K6.01; recusar `a.b` falha P1.02; só o primeiro parâmetro NÃO falha nada (achado 1).
- **(a) `" .. "` com espaços**: v2 aparado por `getIdParameter` e recusado; v1 não é aparado e vira `DELETE /api/v1/schedule/%20..%20`, segmento literal, sem escapar da rota. Seguro. Nenhum teste nomeia o caso da v2 aparada.
- **(b) `0`, `false`, `5` em ID**: URL `/schedule/0`, `/false`, `/5`, iguais nas duas versões, sem recusa.
- **(c) `%2e%2e`, `.%2e`, `../x`**: viram `%252e%252e`, `.%252e`, `..%2Fx`; passam como texto, sem escapar. Seguro.
- **(d) `e001` com `..` só em um dos dois parâmetros**: lança `Bot Id is not valid` ou `Contact Id is not valid`, 0 requisições, v1 e v2.
- **(e) `..` em query (`additionalQueryParameters`)**: segue na query, não é recusado, como o plano diz.
- **(g) mensagem**: `Schedule Id is not valid` (nome do parâmetro em Title Case, mesma forma do Kanban) nas duas versões, `itemIndex` preenchido.
- **(f) `absoluteUrl`**: só uma operação (`e241`, `link_Completo_Webhook`) usa URL absoluta digitada pela pessoa; não passa por `buildEndpointPath`. Fora do escopo declarado (não é segmento de caminho), sem caminho aberto novo.
- **Outro ponto que monta caminho**: `grep` em `nodes/` por `pathTemplate`, `replaceTemplateVariables`, `absoluteUrl`, `getIdParameter` mostra `buildEndpointPath` como o único lugar que interpola parâmetro de caminho. `methods/listSearch.ts` usa rotas fixas (`/api/v1/contacts` etc.), sem ID interpolado.
- **Regressão para ID válido**: 137 operações com caminho x 8 valores (`x1`, `a.b`, `...`, `123`, `0`, `" ok "`, `.x`, `x.`) x v1 e v2 = 2192 execuções; a saída (requisições gravadas) de `origin/main` compilado e de HEAD é idêntica (diff vazio, 0 erros).
- **Teste removido** (`K6.01 as operações antigas não mudam com ponto no ID`): remoção legítima. Ele afirmava o comportamento que o ticket inverte (operação antiga aceitando `..`); manter faria a suíte contradizer o C1. A cobertura contrária passou para P1.01. O `K5.02` afrouxado para `^1\.2\.\d+$` é aceitável porque o P1.04 prova a versão exata; só o título do teste ainda diz "1.2.0".
