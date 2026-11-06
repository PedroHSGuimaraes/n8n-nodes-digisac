# Digisac: recurso Kanban (17 rotas novas) - checks

Build: `npm run build --silent`; `npx tsc --noEmit`; `npm run lint --silent`
Run unit: `npm test`
Plan: `.specs/features/rotas-novas/plan.md`

## Intent

40 checks in 5 slices · 4 one-way doors · 0 open, 0 block

## Checks

### S1 - catálogo com as 17 rotas e IDs antigos intactos

**C1** - As 298 chamadas da 1.1.0 mantêm `id`, `method` e `rawUrl` no catálogo de 315 (S1 AC 1)
Proof: run unit | ✔ K1.01 os 298 IDs antigos

**C2** - As 17 chamadas novas levam `e299` a `e315`, na ordem da coleção (S1 AC 1)
Proof: run unit | ✔ K1.02 IDs novos

**C3** - `reuseIds` reaproveita o ID conhecido por método, URL e pasta e numera a rota nova a partir do maior ID, mesmo com a coleção em outra ordem (S1 AC 1)
Proof: run unit | ✔ K1.03 reuseIds

**C4** - O recurso `general_kanban` tem as 17 chamadas com método e caminho da tabela `Surface` (S1 AC 2)
Proof: run unit | ✔ K1.04 as 17 rotas

**C5** - `normalizePath` troca `/v1/kanban-*` por `/api/v1/kanban-*` e deixa `/v1/cards` como está (S1 AC 3)
Proof: run unit | ✔ K1.05 o gerador põe /api nos PUT

**C6** - O `build` do `package.json` não chama o gerador (S1 AC 4)
Proof: run unit | ✔ K1.06 o build não chama o gerador

### S2 - as 17 operações enviam a requisição certa

**C7** - Listar quadros envia `GET /api/v1/kanban-boards` com `qs.query` e `timeout` 30000 (S2 AC 1)
Proof: run unit | ✔ K2.01 listar quadros

**C8** - Buscar quadro envia `GET /api/v1/kanban-boards/b1` (S2 AC 2)
Proof: run unit | ✔ K2.02 buscar quadro

**C9** - Criar quadro envia o body só com os campos adicionados, e `timeoutAlertEnabled` vai como booleano quando adicionado (S2 AC 3)
Proof: run unit | ✔ K2.03 criar quadro

**C10** - Editar quadro envia `PUT /api/v1/kanban-boards/b1` com `{ name }` (S2 AC 4)
Proof: run unit | ✔ K2.04 editar quadro

**C11** - Listar colunas monta a query com e sem quadro (S2 AC 5)
Proof: run unit | ✔ K2.05 listar colunas

**C12** - Buscar coluna envia `GET /api/v1/kanban-columns/c1` (S2 AC 6)
Proof: run unit | ✔ K2.06 buscar coluna

**C13** - Criar coluna envia o body com `ticketWaitTimeMinutes` numérico e `isDraggable` só quando adicionado (S2 AC 7)
Proof: run unit | ✔ K2.07 criar coluna

**C14** - Editar coluna envia `PUT /api/v1/kanban-columns/c1` com `{ name }` (S2 AC 8)
Proof: run unit | ✔ K2.08 editar coluna

**C15** - Reordenar coluna envia `PATCH` em `/reorder` com `beforeColumnId` e `afterColumnId` (S2 AC 9)
Proof: run unit | ✔ K2.09 reordenar coluna

**C16** - Listar cards monta a query com coluna e usuário, só com coluna e sem nenhum (S2 AC 10)
Proof: run unit | ✔ K2.10 listar cards

**C17** - Buscar card envia `GET /api/v1/kanban-cards/k1` (S2 AC 11)
Proof: run unit | ✔ K2.11 buscar card

**C18** - Criar card envia `{ columnId, ticketId }` (S2 AC 12)
Proof: run unit | ✔ K2.12 criar card

**C19** - Editar card envia `position` numérico só quando adicionado (S2 AC 13)
Proof: run unit | ✔ K2.13 editar card

**C20** - Reordenar card envia `PATCH` em `/reorder` com os quatro campos (S2 AC 14)
Proof: run unit | ✔ K2.14 reordenar card

**C21** - ID de path vazio lança o erro do campo certo (`Board Id`, `Column Id`, `Card Id`) (S2 AC 15)
Proof: run unit | ✔ K2.15 ID vazio

**C22** - `401` e `404` do Digisac em qualquer das 17 operações viram `NodeApiError` com o código HTTP (Surface: statuses)
Proof: run unit | ✔ K2.16 erros do Digisac

### S3 - apagar só com confirmação

**C23** - As três operações de apagar expõem `Confirm Delete` booleano, padrão `false`, e a descrição da operação começa com `Warning:` (S3 AC 1)
Proof: run unit | ✔ K3.01 as três operações de apagar têm o campo Confirm Delete

**C24** - Sem confirmação (desligada ou ausente), cada uma das três lança a mensagem certa e grava zero requisições (S3 AC 2)
Proof: run unit | ✔ K3.02 sem confirmação cada uma das três recusa

**C25** - Excluir quadro com confirmação envia `DELETE /api/v1/kanban-boards/b1` (S3 AC 3)
Proof: run unit | ✔ K3.03 excluir quadro

**C26** - Excluir coluna com confirmação envia o body `{ cardsDestinationColumnId }` (S3 AC 4)
Proof: run unit | ✔ K3.04 excluir coluna

**C27** - Excluir card com confirmação envia `DELETE /api/v1/kanban-cards/k1` (S3 AC 5)
Proof: run unit | ✔ K3.05 excluir card

**C28** - Nenhuma outra `DELETE` do catálogo ganha o campo nem a recusa (S3 AC 6)
Proof: run unit | ✔ K3.06 outras DELETE

### S4 - quadro, coluna e card como lista pesquisável

**C29** - Na versão 2, os 3 IDs de path, as 7 chaves de body e os 2 placeholders de query viram `resourceLocator` com `list` e `id` (S4 AC 1)
Proof: run unit | ✔ K4.01 quadro, coluna e card viram resourceLocator

**C30** - A lista de quadros chama `GET /api/v1/kanban-boards`, filtra o texto sem acento e lê array puro e `{ data }` (S4 AC 2)
Proof: run unit | ✔ K4.02 lista de quadros

**C31** - A lista de colunas filtra por `where.kanbanBoardId` quando o campo auxiliar tem quadro e não filtra quando está vazio (S4 AC 3)
Proof: run unit | ✔ K4.03 lista de colunas

**C32** - A lista de cards filtra por `where.columnId` e devolve lista vazia, sem chamar a API, quando o campo auxiliar está vazio (S4 AC 4)
Proof: run unit | ✔ K4.04 lista de cards

**C33** - `Filter by Board` e `Filter by Column` existem só na versão 2, só nas operações que escolhem coluna ou card, e não saem na requisição (S4 AC 5)
Proof: run unit | ✔ K4.05 campos auxiliares

**C34** - `401` nas três listas vira `NodeApiError` com o código 401 (S4 AC 6)
Proof: run unit | ✔ K4.06 401 nas listas

**C35** - Na versão 2, `list` e `id` com espaço chegam como `b1` em quadro, coluna e card (S4 AC 7)
Proof: run unit | ✔ K4.07 a versão 2 lê list e id

### S5 - versões, compatibilidade e documentação

**C36** - Na versão 1, todo parâmetro das 298 operações antigas mantém `name` e `type`, e as 17 novas aparecem com texto (S5 AC 1)
Proof: run unit | ✔ K5.01 a versão 1 vê as operações novas

**C37** - O `package.json` está em `1.2.0` e o `CHANGELOG.md` tem a seção `## 1.2.0` (S5 AC 2)
Proof: run unit | ✔ K5.02 versão e changelog

**C38** - O README cita as operações do Kanban, o exemplo de mover card, o exemplo de apagar com confirmação e a seção de Tool de IA (S5 AC 3)
Proof: run unit | ✔ K5.03 README do Kanban

**C39** - `npm run generate:docs` grava 315 chamadas em `docs/api-calls.md` e preserva o resto do README (S5 AC 4)
Proof: run unit | ✔ K5.04 a documentação gerada lista 315 chamadas

**C40** - Lint, tsc, build e a suíte saem com código 0 (S5 AC 5)
Proof: run unit | ℹ fail 0

## Coverage

| Set (size) | Member -> proof | Unproven |
| --- | --- | --- |
| rotas Kanban em `Surface` (17) | `/api/v1/kanban-boards` GET C7 · `/api/v1/kanban-boards/{boardId}` GET C8 · `/api/v1/kanban-boards` POST C9 · `/api/v1/kanban-boards/{boardId}` PUT C10 · `/api/v1/kanban-boards/{boardId}` DELETE C25 · `/api/v1/kanban-columns` GET C11 · `/api/v1/kanban-columns/{columnId}` GET C12 · `/api/v1/kanban-columns` POST C13 · `/api/v1/kanban-columns/{columnId}` PUT C14 · `/api/v1/kanban-columns/{columnId}` DELETE C26 · `/api/v1/kanban-columns/{columnId}/reorder` PATCH C15 · `/api/v1/kanban-cards` GET C16 · `/api/v1/kanban-cards/{cardId}` GET C17 · `/api/v1/kanban-cards` POST C18 · `/api/v1/kanban-cards/{cardId}` PUT C19 · `/api/v1/kanban-cards/{cardId}` DELETE C27 · `/api/v1/kanban-cards/{cardId}/reorder` PATCH C20 | - |
| status por rota (4) | 200 C7 · 401 C22 · 404 C22 · recusa local C24 | - |
| IDs antigos do catálogo (298) | C1, table-driven sobre os 298 | - |
| operações novas de apagar (3) | `Excluir quadro` C24 C25 · `Excluir coluna` C24 C26 · `Excluir card` C24 C27 | - |
| tipos de ID guiados no Kanban (12) | C29, table-driven sobre os 12 | - |
| listas do `listSearch` (3) | quadros C30 · colunas C31 · cards C32 | - |
| exemplos da regra de query (5) | com quadro C11 · sem quadro C11 · coluna e usuário C16 · só coluna C16 · nenhum C16 | - |
| doors em `Landing` (4) | ID da operação C1 C2 C3 · nome dos parâmetros C29 · formato do Resource Locator C29 C35 · versão do pacote C37 | - |

## Swept

- validation: C21 C24 (ID vazio e apagar sem confirmação recusados antes da requisição)
- failure modes: C22 C34 (401 e 404 do Digisac viram `NodeApiError`)
- idempotency: n/a - o node só repassa a requisição; repetir um `POST` cria outro registro no Digisac, como em qualquer operação do catálogo
- authorization: existing - a credencial `digisacApi` e o `401` do Digisac (C22)
- concurrency: n/a - cada item roda em sequência dentro do `execute`; o node não guarda estado
- data lifecycle: C24 C26 (apagar exige confirmação; excluir coluna envia a coluna de destino dos cards)
- dependency failure: C22 C34
- state transitions: n/a - o node não tem estado entre execuções
- observability: n/a - o pacote não tem requisito de log

## Handoff

- **Settled mid-build:** none
- **Dispatched:** none
- **Boundary:** nothing closed yet
- **Abandoned:** none
