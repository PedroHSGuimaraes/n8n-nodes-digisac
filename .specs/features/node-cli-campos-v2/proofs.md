# node-cli-campos-v2 proofs

**HEAD**: e1aae30
**Tree**: clean
**Shell**: /bin/sh
**Result**: 41 pass, 0 fail

| Check | Proof | Result |
| --- | --- | --- |
| C1 | `run unit / ✔ S1.01 o build gerou` | pass |
| C2 | `npm run lint --silent` | pass |
| C3 | `run unit / ✔ S1.03a usa n8n-node` | pass |
| C4 | `run unit / ✔ S1.03b fixa as devDependencies` | pass |
| C5 | `run unit / ✔ S1.04 o lock resolve` | pass |
| C6 | `run unit / ✔ S1.05 mantém os geradores` | pass |
| C7 | `run unit / ✔ S1.06a o CI roda` | pass |
| C8 | `run unit / ✔ S1.06b o CI e a publicação` | pass |
| C9 | `run unit / ℹ fail 0` | pass |
| C10 | `run unit / ✔ S2.01a v1 envia o POST` | pass |
| C11 | `run unit / ✔ S2.01b v1 com espaço` | pass |
| C12 | `run unit / ✔ S2.02 v1 vazio lança` | pass |
| C13 | `run unit / ✔ S2.03 v1 mantém name e type` | pass |
| C14 | `run unit / ✔ S2.04 formato texto` | pass |
| C15 | `run unit / ✔ S3.01 o node nasce` | pass |
| C16 | `run unit / ✔ S3.02a os 8 tipos de path` | pass |
| C17 | `run unit / ✔ S3.02b query e body` | pass |
| C18 | `run unit / ✔ S3.03 os 24 tipos` | pass |
| C19 | `run unit / ✔ S3.04 v2 lê list e id` | pass |
| C20 | `run unit / ✔ S3.05 v2 vazio lança` | pass |
| C21 | `run unit / ✔ S3.06 all na query` | pass |
| C22 | `run unit / ✔ S3.07 busca de contatos` | pass |
| C23 | `run unit / ✔ S3.08 listas dos 7 tipos` | pass |
| C24 | `run unit / ✔ S3.09 paginação` | pass |
| C25 | `run unit / ✔ S3.10 401 na lista` | pass |
| C26 | `run unit / ✔ S3.11 v2 aceita texto` | pass |
| C27 | `run unit / ✔ S4.01 datas viram dateTime` | pass |
| C28 | `run unit / ✔ S4.02 data sai em UTC` | pass |
| C29 | `run unit / ✔ S4.03 data inválida` | pass |
| C30 | `run unit / ✔ S4.04 valores fixos` | pass |
| C31 | `run unit / ✔ S4.05 options saem na query` | pass |
| C32 | `run unit / ✔ S4.06 origin vira options` | pass |
| C33 | `run unit / ✔ S4.07 v1 envia a data` | pass |
| C34 | `run unit / ✔ S5.01 versão 1.1.0` | pass |
| C35 | `run unit / ✔ S5.02 README tem` | pass |
| C36 | `run unit / ✔ S5.03 generate:docs troca` | pass |
| C37 | `run unit / ✔ S5.04 publish.yml usa` | pass |
| C38 | `run unit / ✔ S5.06 o pacote mantém o nome` | pass |
| Build | `npm run build --silent` | pass |
| Build | `npx tsc --noEmit` | pass |
| Build | `npm run lint --silent` | pass |

## Output

`Run unit` - exit 0

```
▶ versão 1 do node
  ✔ S2.01a v1 envia o POST de e001 com query e timeout (2.989259ms)
  ✔ S2.01b v1 com espaço nas pontas não limpa o valor (0.941612ms)
  ✔ S2.02 v1 vazio lança erro de parâmetro de path (1.967153ms)
  ✔ S2.03 v1 mantém name e type de todo parâmetro da 1.0.3 (1.939615ms)
  ✔ S2.04 formato texto devolve data com o texto (0.81397ms)
✔ versão 1 do node (9.556703ms)
ℹ tests 36
ℹ suites 8
ℹ pass 36
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 675.852627
```

`npm run lint --silent` - exit 0

```
┌   n8n-node lint  v0.55.5
```
