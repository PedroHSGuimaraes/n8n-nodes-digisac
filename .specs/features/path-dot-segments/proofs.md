# path-dot-segments proofs

**HEAD**: 394b8eb
**Tree**: clean
**Shell**: /bin/sh
**Result**: 9 pass, 0 fail

| Check | Proof | Result |
| --- | --- | --- |
| C1 | `run unit / ✔ P1.01 toda operação com parâmetro de caminho recusa . e ..` | pass |
| C2 | `run unit / ✔ P1.02 ID normal, com ponto no meio e numérico seguem iguais` | pass |
| C3 | `run unit / ✔ P1.03 nenhum ID de operação nem parâmetro de caminho muda` | pass |
| C4 | `run unit / ✔ K6.01 o Kanban recusa . e .. como ID` | pass |
| C5 | `run unit / ✔ P1.04 versão 1.2.1 e changelog` | pass |
| C6 | `run unit / ℹ fail 0` | pass |
| Build | `npm run build --silent` | pass |
| Build | `npx tsc --noEmit` | pass |
| Build | `npm run lint --silent` | pass |

## Output

`Run unit` - exit 0

```
  ✔ S2.01b v1 com espaço nas pontas não limpa o valor (1.209829ms)
  ✔ S2.02 v1 vazio lança erro de parâmetro de path (2.118686ms)
  ✔ S2.03 v1 mantém name e type de todo parâmetro da 1.0.3 (3.369929ms)
  ✔ S2.04 formato texto devolve data com o texto (1.379882ms)
  ✔ S2.05 v1 envia número e booleano de campo de query como texto (3.721266ms)
  ✔ S2.06 v1 aceita booleano em ID de path como a 1.0.3 (3.056887ms)
✔ versão 1 do node (20.672042ms)
ℹ tests 93
ℹ suites 15
ℹ pass 93
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1062.918158
```
