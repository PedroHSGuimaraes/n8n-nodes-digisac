# Digisac 1.2.1: recusar . e .. em todo parâmetro de caminho - checks

Build: `npm run build --silent`; `npx tsc --noEmit`; `npm run lint --silent`
Run unit: `npm test`

## Intent

Hoje 137 das 315 operações têm parâmetro de caminho (138 parâmetros, 27 delas `DELETE`). Só as 17 do Kanban recusam `.` e `..` como valor; as outras 120 aceitam. O URL resolve esses valores para fora do recurso: com o ID `..`, `/api/v1/<recurso>/..` passa por `new URL` e vira `/api/v1/`, uma rota diferente. Um `DELETE` com `..` chama outra rota do Digisac em silêncio. O achado F2 da revisão do PR #2 apontou isso para o catálogo inteiro.

Quando isso sair: toda operação com parâmetro de caminho falha, antes de qualquer requisição, se o valor for `.` ou `..`, nas versões 1 e 2 do node. A recusa é nova e vale para valor inválido. Um ID normal, um ID com ponto no meio (`a.b`) e um ID numérico continuam enviando a mesma requisição. Nenhum parâmetro, nome ou ID de operação muda.

A checagem já existe em `buildEndpointPath` (`actions/index.ts`), o ponto comum onde o caminho é montado, mas só roda no Kanban. A correção remove essa condição; não duplica a checagem por operação.

6 checks in 1 slice · 0 one-way doors · 0 open, 0 block

## Checks

### S1 - recusa de . e .. no catálogo inteiro

**C1** - Para toda operação com parâmetro de caminho, `.` e `..` lançam `... is not valid` e gravam zero requisições, nas versões 1 e 2
Proof: run unit | ✔ P1.01 toda operação com parâmetro de caminho recusa . e ..

**C2** - Um ID normal, `a.b`, `...` e um ID numérico saem na rota sem mudança, em operação antiga e em operação do Kanban
Proof: run unit | ✔ P1.02 ID normal, com ponto no meio e numérico seguem iguais

**C3** - O catálogo continua com os mesmos 298 IDs antigos e os mesmos parâmetros por operação (nenhum nome, tipo ou ID muda)
Proof: run unit | ✔ P1.03 nenhum ID de operação nem parâmetro de caminho muda

**C4** - O Kanban continua recusando `.` e `..` (K6.01)
Proof: run unit | ✔ K6.01 o Kanban recusa . e .. como ID

**C5** - O pacote está em `1.2.1` e o `CHANGELOG.md` traz a seção `## 1.2.1` que diz que a recusa é nova
Proof: run unit | ✔ P1.04 versão 1.2.1 e changelog

**C6** - Lint, tsc, build e a suíte saem com código 0
Proof: run unit | ℹ fail 0

## Coverage

| Set (size) | Member -> proof | Unproven |
| --- | --- | --- |
| operações com parâmetro de caminho (137) | C1, table-driven sobre as 137 | - |
| valores recusados (2) | `.` C1 · `..` C1 | - |
| valores que seguem iguais (4) | `x1` C2 · `a.b` C2 · `...` C2 · `123` C2 | - |
| versões do node (2) | v1 C1 · v2 C1 | - |
| IDs de operação (315) | C3, table-driven sobre os 315 | - |

## Swept

- validation: C1 C2 (valor inválido recusado na fronteira, valor válido intacto)
- failure modes: C1 (a recusa vem antes de qualquer requisição)
- idempotency: n/a - o node só repassa a requisição
- authorization: n/a - a credencial e o `401` do Digisac não mudam
- concurrency: n/a - cada item roda em sequência
- data lifecycle: C1 (um `DELETE` com `..` não chega ao Digisac)
- dependency failure: n/a - a recusa é local e não chama a API
- state transitions: n/a - o node não guarda estado
- observability: n/a - o pacote não tem requisito de log

## Out of scope

| Excluded | Why |
| --- | --- |
| Valor com barra (`a/b`) ou `%2e%2e` | `encodeURIComponent` já codifica a barra e o `%`; o valor chega ao Digisac como texto |
| Parâmetro de query e campo de body | A falha é do caminho da URL; query e body não são resolvidos como caminho |
| Mudar a mensagem de erro | O Kanban já usa `<Parâmetro> is not valid`; o catálogo inteiro passa a usar o mesmo texto |

## Handoff

- **Settled mid-build:** none
- **Dispatched:** none
- **Boundary:** nothing closed yet
- **Abandoned:** none
