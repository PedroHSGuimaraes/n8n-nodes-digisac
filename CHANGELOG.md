# Changelog

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
