# rotas-novas proofs

**HEAD**: f466213
**Tree**: clean
**Shell**: /bin/sh
**Result**: 44 pass, 0 fail

| Check | Proof | Result |
| --- | --- | --- |
| C1 | `run unit / ✔ K1.01 os 298 IDs antigos` | pass |
| C2 | `run unit / ✔ K1.02 IDs novos` | pass |
| C3 | `run unit / ✔ K1.03 reuseIds` | pass |
| C4 | `run unit / ✔ K1.04 as 17 rotas` | pass |
| C5 | `run unit / ✔ K1.05 o gerador põe /api nos PUT` | pass |
| C6 | `run unit / ✔ K1.06 o build não chama o gerador` | pass |
| C7 | `run unit / ✔ K2.01 listar quadros` | pass |
| C8 | `run unit / ✔ K2.02 buscar quadro` | pass |
| C9 | `run unit / ✔ K2.03 criar quadro` | pass |
| C10 | `run unit / ✔ K2.04 editar quadro` | pass |
| C11 | `run unit / ✔ K2.05 listar colunas` | pass |
| C12 | `run unit / ✔ K2.06 buscar coluna` | pass |
| C13 | `run unit / ✔ K2.07 criar coluna` | pass |
| C14 | `run unit / ✔ K2.08 editar coluna` | pass |
| C15 | `run unit / ✔ K2.09 reordenar coluna` | pass |
| C16 | `run unit / ✔ K2.10 listar cards` | pass |
| C17 | `run unit / ✔ K2.11 buscar card` | pass |
| C18 | `run unit / ✔ K2.12 criar card` | pass |
| C19 | `run unit / ✔ K2.13 editar card` | pass |
| C20 | `run unit / ✔ K2.14 reordenar card` | pass |
| C21 | `run unit / ✔ K2.15 ID vazio` | pass |
| C22 | `run unit / ✔ K2.16 erros do Digisac` | pass |
| C23 | `run unit / ✔ K3.01 as três operações de apagar têm o campo Confirm Delete` | pass |
| C24 | `run unit / ✔ K3.02 sem confirmação cada uma das três recusa` | pass |
| C25 | `run unit / ✔ K3.03 excluir quadro` | pass |
| C26 | `run unit / ✔ K3.04 excluir coluna` | pass |
| C27 | `run unit / ✔ K3.05 excluir card` | pass |
| C28 | `run unit / ✔ K3.06 outras DELETE` | pass |
| C29 | `run unit / ✔ K4.01 quadro, coluna e card viram resourceLocator` | pass |
| C30 | `run unit / ✔ K4.02 lista de quadros` | pass |
| C31 | `run unit / ✔ K4.03 lista de colunas` | pass |
| C32 | `run unit / ✔ K4.04 lista de cards` | pass |
| C33 | `run unit / ✔ K4.05 campos auxiliares` | pass |
| C34 | `run unit / ✔ K4.06 401 nas listas` | pass |
| C35 | `run unit / ✔ K4.07 a versão 2 lê list e id` | pass |
| C36 | `run unit / ✔ K5.01 a versão 1 vê as operações novas` | pass |
| C36 | `run unit / ✔ S2.03 v1 mantém name e type` | pass |
| C37 | `run unit / ✔ K5.02 versão e changelog` | pass |
| C38 | `run unit / ✔ K5.03 README do Kanban` | pass |
| C39 | `run unit / ✔ K5.04 a documentação gerada lista 315 chamadas` | pass |
| C40 | `run unit / ℹ fail 0` | pass |
| Build | `npm run build --silent` | pass |
| Build | `npx tsc --noEmit` | pass |
| Build | `npm run lint --silent` | pass |

## Output

`Run unit` - exit 0

```
  ✔ S2.01b v1 com espaço nas pontas não limpa o valor (1.798173ms)
  ✔ S2.02 v1 vazio lança erro de parâmetro de path (2.129085ms)
  ✔ S2.03 v1 mantém name e type de todo parâmetro da 1.0.3 (3.112569ms)
  ✔ S2.04 formato texto devolve data com o texto (1.388915ms)
  ✔ S2.05 v1 envia número e booleano de campo de query como texto (4.044373ms)
  ✔ S2.06 v1 aceita booleano em ID de path como a 1.0.3 (2.246317ms)
✔ versão 1 do node (20.033891ms)
ℹ tests 87
ℹ suites 13
ℹ pass 87
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 848.374444
```
