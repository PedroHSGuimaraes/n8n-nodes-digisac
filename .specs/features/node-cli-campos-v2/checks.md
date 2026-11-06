# Digisac: node-cli 0.55 e campos guiados (versão 2 do node) - checks

Build: `npm run build --silent`; `npx tsc --noEmit`; `npm run lint --silent`
Run unit: `npm test`
Plan: `.specs/features/node-cli-campos-v2/plan.md`

## Intent

34 checks in 5 slices · 5 one-way doors · 0 open, 0 block

## Checks

### S1 - toolchain do node-cli 0.55.5 e build sem rede

**C1** - O build gera o node, a credencial e os ícones em `dist` sem baixar nada (S1 AC 1)
Proof: run unit | ✔ S1.01 o build gerou

**C2** - `npm run lint` sai com código 0 e 0 erros (S1 AC 2)
Proof: `npm run lint --silent`

**C3** - O `package.json` usa `n8n-node` no build e no lint e liga o `n8n.strict` (S1 AC 3)
Proof: run unit | ✔ S1.03a usa n8n-node

**C4** - As devDependencies são as do plano, sem `dependencies` e sem gulp (S1 AC 3)
Proof: run unit | ✔ S1.03b fixa as devDependencies

**C5** - O lock resolve `n8n-workflow` na 2.46 ou mais nova (S1 AC 4)
Proof: run unit | ✔ S1.04 o lock resolve

**C6** - Os scripts `generate:endpoints` e `generate:docs` existem e o `build` não chama nenhum (S1 AC 5)
Proof: run unit | ✔ S1.05 mantém os geradores

**C7** - O CI roda `npm ci`, lint, teste e build (S1 AC 6)
Proof: run unit | ✔ S1.06a o CI roda

**C8** - O CI e a publicação usam a mesma `node-version` (S1 AC 6)
Proof: run unit | ✔ S1.06b o CI e a publicação

**C9** - A suíte inteira sai com `fail 0` (S1 AC 7)
Proof: run unit | ℹ fail 0

### S2 - versão 1 continua igual

**C10** - A versão 1 chama `POST /api/v1/bots/b1/trigger-signal/c1` com `qs` `{ flag: 'flagAqui' }` e `timeout` definido (S2 AC 1)
Proof: run unit | ✔ S2.01a v1 envia o POST

**C11** - A versão 1 com `' c1 '` usa `c1` na rota, como a 1.0.3 (S2 AC 1)
Proof: run unit | ✔ S2.01b v1 com espaço

**C12** - A versão 1 com `path_e001_contactId` vazio lança `NodeOperationError` com a mensagem do plano (S2 AC 2)
Proof: run unit | ✔ S2.02 v1 vazio lança

**C13** - Todo parâmetro da 1.0.3, das 298 operações, continua na versão 1 com o mesmo `name` e `type` (S2 AC 3)
Proof: run unit | ✔ S2.03 v1 mantém name e type

**C14** - `Response Format` `Text` devolve `{ data: <texto> }` (S2 AC 4)
Proof: run unit | ✔ S2.04 formato texto

### S3 - IDs guiados na versão 2

**C15** - O node nasce com `typeVersion` 2 e declara `version` `[1, 2]` (S3 AC 1)
Proof: run unit | ✔ S3.01 o node nasce

**C16** - Os 8 tipos de ID de path viram `resourceLocator` com `list` (padrão, pesquisável) e `id` (S3 AC 2)
Proof: run unit | ✔ S3.02a os 8 tipos de path

**C17** - Os filtros de query e as chaves do body de serviço, departamento, usuário e contato viram `resourceLocator` (S3 AC 2)
Proof: run unit | ✔ S3.02b query e body

**C18** - Os 24 tipos de ID restantes viram `resourceLocator` só com o modo `id` (S3 AC 3)
Proof: run unit | ✔ S3.03 os 24 tipos

**C19** - A versão 2 com `list` `c1` e `id` `' b1 '` chama `POST /api/v1/bots/b1/trigger-signal/c1` (S3 AC 4)
Proof: run unit | ✔ S3.04 v2 lê list e id

**C20** - A versão 2 com `value` vazio lança `NodeOperationError` `The 'Contact Id' parameter is empty [item 0]` com a descrição do plano (S3 AC 5)
Proof: run unit | ✔ S3.05 v2 vazio lança

**C21** - O filtro de query da versão 2 com modo `id` e valor `all` envia `all` (S3 AC 6)
Proof: run unit | ✔ S3.06 all na query

**C22** - A lista de contatos usa `$iLike` em `data.number` para dígitos, em `name` para letras e nenhum filtro para texto vazio (S3 AC 7)
Proof: run unit | ✔ S3.07 busca de contatos

**C23** - Cada um dos 7 outros tipos chama a rota de listagem certa e filtra o texto no node sem acento nem maiúscula (S3 AC 8)
Proof: run unit | ✔ S3.08 listas dos 7 tipos

**C24** - A página cheia (50) devolve `paginationToken` com a próxima página, a página curta não, e nenhuma chamada baixa tudo (S3 AC 9)
Proof: run unit | ✔ S3.09 paginação

**C25** - O `401` do Digisac na lista vira `NodeApiError` com o código `401` (S3 AC 10)
Proof: run unit | ✔ S3.10 401 na lista

**C26** - Um ID em texto na versão 2 (workflow migrado à mão) vale como `value` (S3 AC 11)
Proof: run unit | ✔ S3.11 v2 aceita texto

### S4 - datas e valores fixos na versão 2

**C27** - `startPeriod`, `endPeriod`, `from` e `to` viram `dateTime` na versão 2 em todas as operações onde existem (S4 AC 1)
Proof: run unit | ✔ S4.01 datas viram dateTime

**C28** - `startPeriod` `2026-01-01T00:00:00.000-03:00` sai como `2026-01-01T03:00:00.000Z` (S4 AC 2)
Proof: run unit | ✔ S4.02 data sai em UTC

**C29** - Data inválida lança `NodeOperationError` `The 'Start Period' parameter is not a valid date [item 0]` (S4 AC 3)
Proof: run unit | ✔ S4.03 data inválida

**C30** - `status`, `periodType`, `type`, `departmentParticipation` e `userParticipation` viram `options` com as alternativas da documentação (S4 AC 4)
Proof: run unit | ✔ S4.04 valores fixos

**C31** - `type` `nps` e `periodType` `open` saem na query de `e112` (S4 AC 5)
Proof: run unit | ✔ S4.05 options saem na query

**C32** - `origin` do body de mensagem vira `options` `bot`/`user` na versão 2 e continua texto na 1 (S4 AC 6)
Proof: run unit | ✔ S4.06 origin vira options

**C33** - A versão 1 envia a data em texto sem conversão (S4 AC 7)
Proof: run unit | ✔ S4.07 v1 envia a data

### S5 - documentação e lançamento 1.1.0

**C34** - O `package.json` está em `1.1.0` com `funding` do dono e o `CHANGELOG.md` tem a seção `## 1.1.0` (S5 AC 1)
Proof: run unit | ✔ S5.01 versão 1.1.0

**C35** - O README tem as seções do padrão completo e não tem Trigger (S5 AC 2)
Proof: run unit | ✔ S5.02 README tem

**C36** - `generate:docs` troca só o bloco entre marcadores do README (S5 AC 3)
Proof: run unit | ✔ S5.03 generate:docs troca

**C37** - O `publish.yml` roda o stage do npm 12.2.2 com provenance, `RELEASE_MODE`, `workflow_dispatch` e os passos antes do stage (S5 AC 4)
Proof: run unit | ✔ S5.04 publish.yml usa

**C38** - O pacote mantém o nome `n8n-nodes-digisac` (porta do nome no Landing)
Proof: run unit | ✔ S5.06 o pacote mantém o nome

## Coverage

| Set (size) | Member -> proof | Unproven |
| --- | --- | --- |
| tipos de ID com lista (8) | `contactId` `serviceId` `departmentId` `userId` `tagId` `roleId` `botId` `ticketTopicId` C16, table-driven over all 8; listas C22 C23 | - |
| outros tipos de ID de path só com `id` (24) | C18, table-driven over all 24 | - |
| rotas de listagem (8) | `contacts` C22 · `services` C23 · `departments` C23 · `users` C23 · `tags` C23 · `roles` C23 · `bots` C23 · `ticket-topics` C23 | - |
| node `digisac` versão 2 statuses (2) | 200 C19 · 401 C25 | - |
| node `digisac` versão 1 statuses (1) | 200 C10 | - |
| `listSearch` statuses (2) | 200 C22 · 401 C25 | - |
| campos de data (4) | `startPeriod` C27 · `endPeriod` C27 · `from` C27 · `to` C27 | - |
| enums de query (5) | `status` C30 · `periodType` C30 · `type` C30 · `departmentParticipation` C30 · `userParticipation` C30 | - |
| portas do Landing (5) | versão do node C15 · nome dos parâmetros C13 · formato do valor C16 C18 · versão do pacote C34 · nome no npm C38 | - |

- Claims naming a status code, route or response shape: C10, C19, C22, C23, C25 - each has a proof that crosses the boundary
- No other check claims more than the single case its proof exercises

## Swept

- validation: C12, C20, C29
- failure modes: C25
- idempotency: n/a - o node só repassa requisições; não grava estado
- authorization: C25
- concurrency: n/a - cada item roda em série dentro do `execute`; a lista pede uma página por vez
- data lifecycle: C13, C26
- dependency failure: C25
- state transitions: n/a - o node não tem estado
- observability: n/a - o node devolve o erro da API ao n8n; não há requisito de log

## Handoff

- **Settled mid-build:** none
- **Dispatched:** Verifier (fresh sub-agent, haiku/sonnet) a partir do HEAD e1aae30, rodada 1
- **Boundary:** C1-C38 fechados em e1aae30 (41 provas verdes em check_proofs.py)
- **Abandoned:** none
- **Pending (fora do brief):** S5 AC 5, a tag `v1.1.0` e a aprovação do npm; o brief proíbe tag e publicação, então o dono cria a tag depois do merge
