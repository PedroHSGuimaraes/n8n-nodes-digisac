# node-cli-campos-v2 verification

**Verdict**: FAIL
**Proofs**: `proofs.md` at e1aae30 (branch HEAD 8b95a7b; diff range `origin/main..HEAD`)
**Verifier**: independent sub-agent (author != verifier)

## Checks

| Check | Test | Holds |
| --- | --- | --- |
| C1 | `estrutura.test.cjs` `S1.01 o build gerou node, credencial e ícones em dist` | yes - but it checks only the `.svg` icons; the node's `icon` is `digisac.png` / `digisac.dark.png`, and "sem rede" is not asserted (see F6) |
| C2 | lone proof `npm run lint --silent` (exit code) | yes |
| C3 | `estrutura.test.cjs` `S1.03a usa n8n-node no build e no lint, com strict ligado` | yes |
| C4 | `estrutura.test.cjs` `S1.03b fixa as devDependencies do plano e não tem dependencies nem gulp` | yes |
| C5 | `estrutura.test.cjs` `S1.04 o lock resolve n8n-workflow na 2.46 ou mais nova` | yes |
| C6 | `estrutura.test.cjs` `S1.05 mantém os geradores como scripts manuais fora do build` | yes |
| C7 | `estrutura.test.cjs` `S1.06a o CI roda npm ci, lint, teste e build` | yes - substring `includes`, so a YAML comment would satisfy it |
| C8 | `estrutura.test.cjs` `S1.06b o CI e a publicação usam a mesma node-version` | yes |
| C9 | `run unit` summary line `ℹ fail 0` | yes |
| C10 | `versao1.test.cjs` `S2.01a v1 envia o POST de e001 com query e timeout` | yes - method, baseURL, url, `qs` deepEqual, credential type, timeout 30000 |
| C11 | `versao1.test.cjs` `S2.01b v1 com espaço nas pontas não limpa o valor` | yes |
| C12 | `versao1.test.cjs` `S2.02 v1 vazio lança erro de parâmetro de path` | yes |
| C13 | `versao1.test.cjs` `S2.03 v1 mantém name e type de todo parâmetro da 1.0.3` | yes - checks presence of each 1.0.3 key; it does not assert that no v2 copy is visible on v1 (see F11) |
| C14 | `versao1.test.cjs` `S2.04 formato texto devolve data com o texto` | yes |
| C15 | `seletores.test.cjs` `S3.01 o node nasce na versão 2 e mantém a 1` | yes |
| C16 | `seletores.test.cjs` `S3.02a os 8 tipos de path viram resourceLocator com lista e id` | yes - table-driven over every operation of the 8 types; modes, `searchable`, `searchListMethod`, default mode |
| C17 | `seletores.test.cjs` `S3.02b query e body de contato, serviço, departamento e usuário viram resourceLocator` | yes - the selector regex copies the implementation's regex, and `searchListMethod` is not asserted for query or body (see F7) |
| C18 | `seletores.test.cjs` `S3.03 os 24 tipos restantes de path viram resourceLocator só com id` | yes - derived from the catalog, not from the implementation |
| C19 | `seletores.test.cjs` `S3.04 v2 lê list e id e remove o espaço das pontas` | yes |
| C20 | `seletores.test.cjs` `S3.05 v2 vazio lança erro com a descrição do que fazer` | yes - exact message and description |
| C21 | `seletores.test.cjs` `S3.06 all na query de departamento da v2 vai como all` | yes |
| C22 | `seletores.test.cjs` `S3.07 busca de contatos usa $iLike em número, nome ou nada` | yes for the three named cases; mixed text and `+` phone are untested (see F1, F2) |
| C23 | `seletores.test.cjs` `S3.08 listas dos 7 tipos usam a rota certa e filtram no node` | yes - route, `perPage`, accent and case; it does not assert that no `where[...]` goes to the API |
| C24 | `seletores.test.cjs` `S3.09 paginação devolve token só com página cheia e pede uma página por vez` | no - the short page is 12 items; a bound moved to `>= 13` passes, and 49 is never tried (see F3) |
| C25 | `seletores.test.cjs` `S3.10 401 na lista vira NodeApiError com o código` | yes |
| C26 | `seletores.test.cjs` `S3.11 v2 aceita texto de workflow migrado à mão` | yes - uses `'c1'` without edge spaces, so trim on text is unpinned (see F5) |
| C27 | `datas-opcoes.test.cjs` `S4.01 datas viram dateTime em todas as operações` | yes - 50 names, exactly one v2 copy each |
| C28 | `datas-opcoes.test.cjs` `S4.02 data da v2 sai em UTC na query` | yes - input has an explicit offset, so it does not depend on the machine time zone |
| C29 | `datas-opcoes.test.cjs` `S4.03 data inválida lança erro de parâmetro` | yes for `'não é data'` only; the validator is `new Date()`, which is far looser (see F4) |
| C30 | `datas-opcoes.test.cjs` `S4.04 valores fixos viram options com as alternativas da documentação` | yes - the 16 fields come from the catalog templates; the wire value `openDate` of e109/e281 is untested (see F8) |
| C31 | `datas-opcoes.test.cjs` `S4.05 options saem na query com o valor escolhido` | yes |
| C32 | `datas-opcoes.test.cjs` `S4.06 origin do body vira options na v2 e continua texto na v1` | yes - 10 collections, v1 string and v2 `['', 'bot', 'user']` |
| C33 | `datas-opcoes.test.cjs` `S4.07 v1 envia a data em texto sem conversão` | yes |
| C34 | `publicacao.test.cjs` `S5.01 versão 1.1.0, funding do dono e seção no CHANGELOG` | yes |
| C35 | `publicacao.test.cjs` `S5.02 README tem as seções do padrão completo e não tem Trigger` | yes |
| C36 | `publicacao.test.cjs` `S5.03 generate:docs troca só o bloco entre marcadores` | no - it tests `substituirBloco`, not the `generate-docs.mjs` script that the claim names (see F9) |
| C37 | `publicacao.test.cjs` `S5.04 publish.yml usa o stage do npm 12.2.2 com provenance` | yes - `RELEASE_MODE` and `workflow_dispatch` are matched anywhere in the file, not on the stage step |
| C38 | `publicacao.test.cjs` `S5.06 o pacote mantém o nome n8n-nodes-digisac` | yes |
| C39 | `seletores.test.cjs` `S3.12 busca de contato limpa o + e escapa % e _` | yes - asserta o valor exato de `qs` para telefone com +, texto misto e curinga (check anexado após o Verifier, do achado F1/F2; sem segundo Verifier) |
| C40 | `seletores.test.cjs` `S3.13 página cheia sem acerto no filtro do node ainda devolve token` | yes - asserta `results` vazio e token `2` (achado F10) |
| C41 | `seletores.test.cjs` `S3.14 ID de path em texto na v2 perde o espaço e número vale` | yes - asserta a URL final para `' c1 '` e `123` (achado F5) |
| C42 | `seletores.test.cjs` `S3.15 cópias da v2 ficam invisíveis na v1` | yes - conta uma cópia por versão em cada grupo nome+onde e exige mais de 250 grupos (achado F11) |
| C43 | `datas-opcoes.test.cjs` `S4.08 datas estritas: lixo e dia inexistente falham, Date e sem fuso valem` | yes - asserta o erro para 4 valores ruins e o ISO exato para 4 formas válidas (achado F4) |
| C44 | `datas-opcoes.test.cjs` `S4.09 periodType open sai como openDate onde a documentação cola Date` | yes - asserta `qs.periodType` igual a `openDate` em e109 (achado F8) |

## Findings

Own examples, run at HEAD over `dist` as throwaway tests (not committed): contact search with mixed text, a full and short page, a date without time zone, an empty body ID, and number and `Date` values. The empty body ID is correct: `{ contactId: { value: '' }, userId: { value: ' u1 ' } }` gave body `{"userId":"u1"}`.

| Finding | Evidence | Fix | Closed |
| --- | --- | --- | --- |
| F1: a phone typed with `+` (`+55 (11) 9999-8888`) goes to the API as `%+551199998888%`; the `+` stays in the `$iLike` pattern. A mixed text such as `ana 5511` goes to `where[name]` only. The plan fixes only `5511` and `ana`. | probe: `searchContacts('+55 (11) 9999-8888')` sent `where[data.number][$iLike]` `%+551199998888%`; `listSearch.ts` `contactFilter` strips only `[\s()-]` | strip the `+` before the number filter and add S3.07 cases for `+55 (11) 9999-8888` and for mixed text; decide mixed text and record it in Assumptions | a3e9cd2 - C39 (S3.12) |
| F2: the user text goes into `$iLike` unescaped, so `%` and `_` act as wildcards (`100%` becomes `%100%%`). | probe: `where[name][$iLike]` `%100%%` | escape `%`, `_` and `\` in the text before wrapping, with a test | a3e9cd2 - C39 (S3.12) |
| F3: the pagination bound is pinned by 12 and 50 only. A cap of `perPage` lower than 50 by the API (the collection uses 40 on most listings) makes `items.length >= 50` never true, and the list silently stops at one page. The `perPage` of 50 is `Confirmed? n` in the plan. | probe: 49 items gives no token, 40 gives no token; S3.09 never uses a value between 13 and 49 | add 49 to S3.09 (no token) and 51 (token); when the account is available, confirm that `perPage=50` is accepted | a3e9cd2 - C24 (S3.09 agora tem a página de 49); `perPage=50` segue como Assumptions `Confirmed? n` para a conta real |
| F4: date validation is `new Date(raw)`. `'5'` becomes `2001-05-01T03:00:00.000Z`, `'2026'` becomes `2026-01-01`, `'2026-02-30'` rolls to `2026-03-02`, and a value without time zone uses the n8n server's zone (`2026-01-01T00:00:00` gave `03:00Z` here, `00:00Z` on a UTC runner). A `Date` or Luxon object (expression such as `$now`) is read by `plainValue` as `''` and the filter is dropped without error. | probes C: `5`, `2026`, `2026-02-30`, `Date` object printed `qs` `undefined` | reject values that do not match an ISO 8601 pattern, reject day roll-over, read `Date`/`DateTime` objects through `toISOString()` or `toISO()`, and add tests for each | a3e9cd2 - C43 (S4.08) |
| F5: in v2, a text value on a path ID keeps its edge spaces (`' c1 '` gives `%20c1%20`), while a locator value is trimmed. A number value (`123`) on a text path ID reads as empty and ends in `Missing required path parameter` instead of the `is empty` message. | probes E: `espaco` and `num` | trim text in `getIdParameter` for v2 and accept numbers (`String(raw)`); add a test with edge spaces | a3e9cd2 - C41 (S3.14) |
| F6: S1.01 checks `.svg` icons only; the node and the credential use `.png` and `.dark.png`. It also proves nothing about the network: it reads `dist` after a build that may be stale. | `estrutura.test.cjs` S1.01 file list | add `digisac.png` and `digisac.dark.png` for the node and the credential to the list | a3e9cd2 - C1 (S1.01 lista os png) |
| F7: S3.02b asserts the type and the mode names of the 35 query and 38 body fields, not their `searchListMethod`; a swapped method (a `departmentId` filter pointing to `searchUsers`) passes. The regex that finds the fields is the same one the implementation uses. | `seletores.test.cjs` S3.02b | assert `modes[0].typeOptions.searchListMethod` per type name for query and body fields | a3e9cd2 - C17 (S3.02b confere o searchListMethod) |
| F8: the wire value of `periodType={{open/close}}Date` (e109, e281) is untested. It is correct today (`open` is sent as `openDate`, probe), but S4.04 and S4.05 would not notice a change; a value saved as `openDate` in a hand-migrated v2 workflow would send `openDateDate`. | probes e109: v2 sent `openDate`; saved `openDate` sent `openDateDate` | add e109 `open` to S4.05 and decide on the saved `openDate` | a3e9cd2 - C44 (S4.09); valor `openDate` salvo à mão fica fora, registrado em Assumptions do plano |
| F9: S5.03 imports the helper only. A change to `generate-docs.mjs` that rewrites the whole README keeps S5.03 green. | `publicacao.test.cjs` S5.03; `scripts/generate-docs.mjs` lines 115-118 | run the script against a temporary README copy and compare the text outside the markers | a3e9cd2 - C36 (S5.03b roda o script de verdade) |
| F10: for the 7 node-side lists, the text filters only the page already fetched (50 items). With more than 50 users or tags, an item on page 2 is not found by typing its name; with a full page and no match, the result is empty but carries a token. S3.08 only tests a 2-item page. | `listSearch.ts` `pagedSearch`; probe B: 50 items and text `zzz` gave `{"results":[],"paginationToken":"2"}` | record the limit in the plan (or search the API with `where[name][$iLike]` for these routes once confirmed) and add a test for the full page with no match | a3e9cd2 - C40 (S3.13); limite aceito e registrado em Assumptions do plano |
| F11: C13 reads presence only; no test asserts that a v2 copy is invisible on v1 for the body ID, the query ID and the date, so a missing `@version` on the v2 copy would show two fields on v1. | `versao1.test.cjs` S2.03; `seletores.test.cjs` S3.02b has no v1 side | add a check that every `resourceLocator`, `dateTime` and v2 `options` copy has `@version` limited to `>= 2` | a3e9cd2 - C42 (S3.15) |
