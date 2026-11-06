# Changelog

## 1.2.1

- **Recusa nova de valor inválido.** Todo parâmetro de caminho recusa os valores `.` e `..`. A recusa vale para as 137 operações que têm parâmetro de caminho, nas versões 1 e 2 do node. O node lança `<Parâmetro> is not valid` antes de qualquer requisição.
- **Por que a recusa existe.** O URL resolve `..` para fora do recurso. Com o ID `..`, a rota `/api/v1/<recurso>/..` vira `/api/v1/`, que é outra rota do Digisac. Um `DELETE` com esse valor chamava a rota errada.
- **Quem já usava o Kanban não muda.** As 17 operações do Kanban já recusavam esses valores desde a 1.2.0.
- **O que não muda.** Um ID normal, um ID com ponto no meio (`a.b`) e um ID numérico enviam a mesma requisição de antes. Nenhum parâmetro, nome ou ID de operação muda.

## 1.2.0

- **Kanban: 17 operações novas.** O resource **Kanban (General)** traz quadros (listar, buscar, criar, editar, excluir), colunas (as mesmas cinco e reordenar) e cards (as mesmas cinco e reordenar), todas da coleção Postman oficial. A pasta é a última da coleção que o node ainda não cobria.
- **Quadro, coluna e card em lista pesquisável (versão 2 do node).** Os campos **Filter by Board** e **Filter by Column** estreitam a lista de colunas e de cards; o node não os envia ao Digisac. Na versão 1 as operações novas usam campos de texto.
- **Excluir exige confirmação.** **Excluir quadro**, **Excluir coluna** e **Excluir card** têm o campo **Confirm Delete**, desligado por padrão. Sem ele o node falha antes de qualquer requisição.
- **IDs de operação estáveis.** O gerador `generate:endpoints` lê o catálogo versionado e mantém o ID de cada rota conhecida. As 17 rotas novas levam `e299` a `e315`. Sem essa regra, as 17 rotas inseridas no meio da coleção trocariam o ID de 148 operações e os workflows salvos chamariam outra rota.
- **Quadro, coluna e card recusam `.` e `..` como ID.** O URL resolve esses valores para fora do recurso (`DELETE /kanban-boards/..` cairia na raiz da API). As 298 operações antigas não mudam.
- **Segunda suposição:** o campo `position` de **Editar card** vai como número, e a coleção mostra `"1"` entre aspas.
- **Suposição a confirmar com uma chamada real.** A coleção traz os dois `PUT` do Kanban (editar coluna e editar card) como `/v1/...`, sem `/api`. O node usa `/api/v1/...`, como as outras rotas. Se o Digisac responder `404`, o caminho da coleção é o certo.

## 1.1.0

- **IDs em lista pesquisável (versão 2 do node).** Em node novo, contato, conexão, departamento, usuário, tag, cargo, robô e assunto de chamado mostram a lista da conta, com busca, e aceitam colar o ID. Vale para o path, para os filtros de query e para as chaves de ID do `Body Fields`. Os outros 24 tipos de ID de path viram campo de ID com o modo `By ID`.
- **Datas e valores guiados (versão 2 do node).** Os campos `Start Period`, `End Period`, `From` e `To` têm seletor de data e saem em ISO UTC. `Status`, `Period Type`, `Type`, as participações de departamento e usuário e o `Origin` do body de mensagem viram lista de opções, com a opção `Not Set` para continuarem opcionais.
- **Workflows salvos não mudam.** O node passa a ter `version: [1, 2]` com `defaultVersion` 2. Workflows salvos guardam a version 1 e continuam enviando a mesma requisição da 1.0.3.
- **Migração para o `@n8n/node-cli` 0.55.5.** Build e lint passam a usar `n8n-node build` e `n8n-node lint`, com `n8n.strict`. O `gulp` saiu e os ícones são copiados pelo próprio build. O build não baixa mais a coleção Postman: `generate:endpoints` e `generate:docs` viram scripts manuais.
- **Correção do lint.** Foram corrigidos os 9 erros do lint oficial: padrões de campos, `any` explícito, import sem uso e descrição de campo booleano. O campo `Campos do Body` passou a se chamar `Body Fields`.
- **Timeout de 30 s** em toda requisição ao Digisac.
- **Ferramentas de desenvolvimento.** A devDependency `n8n-workflow` sobe de 2.16.0 para 2.46.5, a versão estável que o n8n 2.46.6 usa. O `peerDependencies` continua `*`.
- **Testes e CI.** O pacote ganha testes automatizados (`npm test`) e o CI roda `npm ci`, lint, teste e build em todo Pull Request.
- **Publicação por stage.** O workflow envia a versão com `npm stage publish` e provenance; o dono a aprova com 2FA no npmjs.com.
- **README completo** no padrão dos outros nodes, e `funding` no `package.json`.

## 1.0.3

- Descrições de AI Tool reforçadas: regra genérica para campos `Id/Ids`, alertas para placeholders, orientação Popular vs General e avisos por tipo de campo de body/query.
