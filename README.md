# n8n-nodes-digisac

[![CI](https://github.com/PedroHSGuimaraes/n8n-nodes-digisac/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/PedroHSGuimaraes/n8n-nodes-digisac/actions/workflows/ci.yml)

Node community do [n8n](https://n8n.io/) para integrar workflows com a **API da Digisac**. O pacote expõe em um único node todas as chamadas publicadas na documentação Postman da Digisac: contatos, chamados, mensagens, campanhas, conexões, departamentos, usuários, tags, templates, webhooks, relatórios, estatísticas, agendamentos e demais recursos operacionais.

O projeto segue o mesmo padrão usado no `n8n-nodes-clinicorp`: um node de ação, uma credencial, TypeScript, catálogo gerado a partir da documentação da API, build validado por CI, publicação no npm via GitHub Actions e suporte a uso como Tool de Agente de IA.

## Funcionalidades

- **Cobertura completa da documentação**: 298 chamadas da coleção pública Postman da Digisac, organizadas em 51 recursos no n8n.
- **Node único e intuitivo**: selecione **Resource -> Operation**, preencha campos simples de path, query e body, e execute.
- **Credencial centralizada**: Base URL e Bearer Token ficam salvos uma única vez na credencial `Digisac API`.
- **Pronto para AI Agent**: o node tem `usableAsTool` com descrição específica de ferramenta e textos pensados para LLMs entenderem método, caminho, efeito da operação, parâmetros, regra de IDs, filtros, campos de body e quando usar JSON avançado.
- **Sem dependências runtime**: usa `httpRequestWithAuthentication` do próprio n8n.
- **Catálogo rastreável**: `nodes/Digisac/generated/endpoints.ts` é gerado da documentação Postman; `docs/api-calls.md` lista todas as chamadas em português.
- **Publicação segura**: GitHub Actions publica no npm com provenance.

## Instalação

No n8n, acesse **Settings -> Community Nodes -> Install** e instale:

```text
n8n-nodes-digisac
```

Para usar community nodes como Tools de Agente de IA em n8n self-hosted, habilite:

```bash
N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE=true
```

Sem essa variável, o node pode funcionar como node normal, mas não aparecer como tool no AI Agent em instalações self-hosted.

## Credenciais

Crie uma credencial chamada **Digisac API**.

| Campo | O que preencher | Onde encontrar |
| --- | --- | --- |
| **Base URL** | URL base da sua conta Digisac, sem barra final. Exemplo: `https://suaempresa.digisac.app`. | Digisac -> Conta -> Informações |
| **Access Token** | Token Bearer de acesso pessoal. | Digisac -> Conta -> API -> Tokens de acesso pessoal |
| **PDF/Base URL** | Base opcional para endpoints documentados como `URLbase`, principalmente export de PDF. Se vazio, o node reutiliza a Base URL. | Use só se sua instância separar URL de API e URL de PDF |

A credencial testa o acesso com:

```http
GET /api/v1/me
```

## Como usar o node

1. Adicione o node **Digisac** no workflow.
2. Escolha o **Resource**. O resource corresponde a uma pasta da documentação, como `Contatos`, `Mensagens`, `Chamados`, `Campanhas`, `Tags`, `Usuários`, `Webhooks`.
3. Escolha a **Operation**. Cada operation corresponde a uma chamada real da API.
4. Preencha os campos obrigatórios de path, como `contactId`, `ticketId`, `serviceId`, `messageId`, `userId`, `campaignId`.
5. Preencha os campos de query que aparecerem, como `Per Page`, `Number`, `Service Id`, `Start Period`, `End Period`, `Status`.
6. Em chamadas `POST`, `PUT` e `PATCH`, use **Campos do Body**. O node gera esses campos a partir do body documentado pela Digisac.
7. Use **Body JSON Avançado** somente quando a operação exigir array, objeto livre ou uma estrutura que não coube nos campos gerados.
8. Use **Options -> Query Avançada JSON** somente para filtros muito específicos não representados por campos.
9. Em exports CSV/TXT/PDF, se a resposta não vier como JSON, use **Options -> Response Format -> Text**.

Resources marcados como **Popular** são atalhos herdados da coleção Postman para operações frequentes. Resources **General** contêm o catálogo mais completo. Se a mesma chamada existir nos dois, use **Popular** para fluxos comuns e **General** quando precisar de uma operação que não aparece em Popular.

Regra para AI Tools e automações: qualquer campo terminado em `Id` ou `Ids` deve vir de busca/listagem anterior, entrada confirmada do usuário ou valor sentinela documentado, como `all`. Nunca copie placeholders como `{{contactId}}`, `{{serviceId}}` ou `{{all/open/close}}`.

## Campos principais do node

| Campo | Uso |
| --- | --- |
| **Resource** | Área funcional da API Digisac, gerada a partir das pastas Postman. |
| **Operation** | Chamada exata da API. A descrição mostra método, endpoint, origem na documentação e placeholders. |
| **Path Parameters** | Campos obrigatórios extraídos de placeholders como `{{contactId}}`. |
| **Campos de query** | Campos simples gerados a partir da URL documentada. Exemplos: `Per Page`, `Number`, `Service Id`, `From`, `To`, `Type`. |
| **Campos do Body** | Coleção de campos gerada a partir do body documentado para operações de escrita. Use antes de qualquer JSON manual. |
| **Use Body JSON Avançado** | Toggle para liberar um editor JSON quando a chamada precisa de array, objeto livre ou payload muito específico. |
| **Options -> Query Avançada JSON** | Objeto JSON livre mesclado na query string. Chaves iguais substituem campos gerados; use apenas quando a chamada precisar de filtro não representado por campo. |
| **Options -> Response Format** | Use `Text` para exportações CSV/TXT/PDF ou respostas que não retornam JSON. |

## Exemplos práticos

### Listar contatos

Resource: **Contatos (General)**  
Operation: **Listar todos os contatos**

Preencha:

- `Per Page`: `40`

### Buscar contato por número em uma conexão

Resource: **Contatos (General)**  
Operation: **Buscar contato por numero de uma conexao especifica**

Preencha:

- `Number`: número ou parte do número
- `Service Id`: ID da conexão

### Enviar mensagem

Resource: **Mensagens (General)**  
Operation: **Enviar mensagem**

Em **Campos do Body**, preencha:

- `Text`: `Olá, tudo bem?`
- `Type`: `chat`
- `Contact Id`: `CONTACT_ID`
- `User Id`: `USER_ID`
- `Origin`: `bot`

### Enviar arquivo por mensagem

Resource: **Mensagens (General)**  
Operation: **Enviar imagem**, **Enviar PDF** ou **Enviar áudio**

Use **Campos do Body** para `Text`, `Number` e `Service Id`. No campo `File`, informe somente o objeto do arquivo, não o body inteiro:

```json
{
  "base64": "BASE64_DO_ARQUIVO",
  "mimetype": "application/pdf",
  "name": "documento.pdf"
}
```

### Buscar chamados de um contato

Resource: **Chamados (General)**  
Operation: **Buscar chamados do contato**

Preencha:

- `Contact Id`: `CONTACT_ID`

### Transferir chamado

Resource: **Chamados (General)**  
Operation: **Transferência de chamado**

Path:

- `Contact Id`: ID do contato

Body:

- `Department Id`: `DEPARTMENT_ID`
- `User Id`: `USER_ID`
- `Comments`: `Transferido pelo fluxo do n8n`

### Fechar chamado com assunto

Resource: **Chamados (General)**  
Operation: **Fechar um chamado com assunto**

Em **Campos do Body**, preencha `Ticket Topic Ids` com:

```json
["TICKET_TOPIC_ID"]
```

### Buscar estatísticas de atendimento

Resource: **Estatísticas de atendimento (General)**  
Operation: **Buscar estatísticas com todos os filtros ativos**

Preencha os campos de query:

- `Start Period`: `2026-07-01T00:00:00.000Z`
- `End Period`: `2026-07-31T23:59:59.999Z`
- `Department Id`: `all`
- `User Id`: `all`
- `Period Type`: `open` ou `close`
- `Status`: `all`, `open` ou `close`

### Criar webhook

Resource: **Webhooks (General)**  
Operation: **Criar webhook**

Em **Campos do Body**, preencha `Active`, `Name`, `Url`, `Events` e `Type`. Para `Events`, use array JSON:

```json
["message.created", "ticket.closed"]
```

## Todas as chamadas da API

O catálogo completo fica em [docs/api-calls.md](docs/api-calls.md).

Resumo por método:

```text
GET: 144 | POST: 93 | PUT: 34 | PATCH: 1 | DELETE: 26
```

Resumo por recurso:

| Recurso | Chamadas |
| --- | ---: |
| Acionamento flag no robo (General) | 1 |
| Agendamentos (General) | 5 |
| Agora (General) | 3 |
| Agora (Popular) | 3 |
| Assuntos de chamado (General) | 5 |
| Auditoria de autenticacao (General) | 2 |
| Autorizacao (General) | 1 |
| Autorizacao (Popular) | 1 |
| Avaliacoes (General) | 5 |
| Campanhas (General) | 7 |
| Campos personalizados (General) | 5 |
| Cargos (General) | 7 |
| Central de notificacoes (General) | 2 |
| Chamados (General) | 7 |
| Chamados (Popular) | 6 |
| Conexoes (General) | 11 |
| Contatos (General) | 22 |
| Contatos (Popular) | 22 |
| Controle de ausencia (General) | 1 |
| Creditos SMS (General) | 3 |
| Departamentos (General) | 6 |
| Distribuicao de chamados (General) | 6 |
| Estatisticas de atendimento (General) | 10 |
| Estatisticas de atendimento (Popular) | 7 |
| Estatisticas de avaliacoes (General) | 7 |
| Feriados (General) | 5 |
| Funil de vendas (General) | 10 |
| Grupos WhatsApp (General) | 4 |
| Historico de chamados (General) | 12 |
| Historico de chamados (Popular) | 9 |
| Idioma da plataforma (General) | 1 |
| Integracoes (General) | 2 |
| Mensagens (General) | 13 |
| Mensagens (Popular) | 8 |
| Mensagens interativas (General) | 7 |
| Meus dados (General) | 1 |
| Notificacao (General) | 3 |
| Organizacoes (General) | 5 |
| Pessoas (General) | 5 |
| Planos (General) | 2 |
| Redefinir senha (General) | 1 |
| Respostas rapidas (General) | 7 |
| Robos (General) | 6 |
| Tags (General) | 8 |
| Templates (General) | 11 |
| Termos de aceite (General) | 5 |
| Tokens (General) | 5 |
| Usuarios (General) | 6 |
| Versoes (General) | 1 |
| Webhooks (General) | 5 |
| WhatsApp (General) | 1 |

## Uso como Tool de Agente de IA

O node pode ser conectado ao **AI Agent** do n8n como uma tool. A prática recomendada é criar uma tool por operação liberada para o agente. Isso limita o escopo do modelo e reduz risco de ações erradas.

### Prompt recomendado para o System Message

```text
Você pode usar as tools Digisac somente quando o usuário pedir para consultar, criar ou alterar dados na Digisac.
Nunca invente IDs. Qualquer campo terminado em Id ou Ids deve vir de busca/listagem anterior, entrada confirmada do usuário ou valor sentinela documentado como all.
Não copie placeholders da documentação, como {{contactId}}, {{serviceId}} ou {{all/open/close}}. Substitua por valor real ou escolha uma opção válida.
Para operações POST, PUT e PATCH, envie um body JSON mínimo, somente com os campos necessários.
Quando a tool expuser Campos do Body, preencha os campos dedicados em vez de gerar um JSON manual.
Use Body JSON Avançado ou Query Avançada JSON apenas quando não existir campo dedicado suficiente para a chamada.
Para filtros de data/hora, use ISO-8601 quando o endpoint esperar timestamp.
Para exportações CSV, TXT ou PDF, use Response Format = Text se a resposta não for JSON.
Antes de criar, editar, excluir, arquivar, bloquear, fechar chamado ou enviar mensagem, confirme que a intenção do usuário está clara.
```

### Exemplos de `$fromAI()`

Contato existente:

```javascript
{{ $fromAI('contactId', 'ID existente de contato Digisac. Deve vir de uma busca/listagem anterior, nunca inventado.', 'string') }}
```

Texto de mensagem:

```javascript
{{ $fromAI('messageText', 'Texto exato que será enviado ao contato no WhatsApp/Digisac.', 'string') }}
```

Filtro de período:

```javascript
{{ $fromAI('startPeriod', 'Início do período em ISO-8601, por exemplo 2026-07-01T00:00:00.000Z.', 'string') }}
```

Campo de body estruturado:

```javascript
{{ $fromAI('file', 'Objeto JSON do arquivo com base64, mimetype e name quando a operação Digisac enviar mídia.', 'json') }}
```

### Boas práticas para LLMs

- Exponha apenas as operações necessárias para o caso de uso.
- Prefira operações de leitura antes de escrita.
- Nunca deixe o modelo inventar IDs.
- Use credenciais dedicadas por ambiente/cliente.
- Para operações destrutivas (`DELETE`, arquivar, bloquear, fechar chamado), coloque etapa humana de confirmação quando o fluxo for sensível.
- Em mensagens enviadas ao cliente, gere o texto em etapa anterior e passe o texto final para a tool.
- Use campos dedicados sempre que existirem. Para bodies grandes ou arrays de múltiplos itens, use JSON explícito e valide campos obrigatórios no workflow antes da chamada.

## Desenvolvimento

```bash
npm install
npm run generate:endpoints
npm run generate:docs
npm run lint
npm run build
npm run dev
```

Estrutura:

```text
n8n-nodes-digisac/
├── credentials/
│   └── DigisacApi.credentials.ts
├── nodes/
│   └── Digisac/
│       ├── Digisac.node.ts
│       ├── actions/
│       ├── generated/
│       ├── helpers/
│       └── transport/
├── scripts/
│   ├── generate-docs.mjs
│   └── generate-endpoints.mjs
└── docs/
    └── api-calls.md
```

## Como o catálogo é gerado

O script `scripts/generate-endpoints.mjs` baixa a coleção pública:

```text
https://documenter.getpostman.com/view/53282970/2sBXihpXmF
```

E gera:

```text
nodes/Digisac/generated/endpoints.ts
```

O script `scripts/generate-docs.mjs` lê esse catálogo e gera:

```text
README.md
docs/api-calls.md
```

## Publicação no npm

O projeto publica pelo mesmo padrão do node Clinicorp: GitHub Actions + npm provenance.

Para publicar nova versão:

```bash
npm version patch
git push origin main --tags
```

O workflow executa:

```bash
npm ci --ignore-scripts
npm run build
npm publish --provenance --access public
```

## Versões

- **1.0.3** — Descrições de AI Tool reforçadas: regra genérica para campos `Id/Ids`, alertas para placeholders, orientação Popular vs General, avisos por tipo de campo de body/query e exemplo de arquivo corrigido.
- **1.0.2** — Interface simplificada: query e body agora usam campos dedicados gerados da documentação. JSON fica escondido em opções avançadas ou aparece apenas nas chamadas em que não há forma segura de gerar campos. Ícone atualizado a partir de `icon.webp`.
- **1.0.1** — Documentação reescrita em PT-BR, com exemplos práticos, instruções de AI Tool e catálogo completo de chamadas em `docs/api-calls.md`.
- **1.0.0** — Primeira versão publicada. Node único `Digisac`, credencial Bearer, catálogo com 298 chamadas da documentação Postman, suporte a AI Agent e publicação npm via GitHub Actions.

## Referências

- [Documentação Postman da Digisac](https://documenter.getpostman.com/view/53282970/2sBXihpXmF)
- [n8n: building community nodes](https://docs.n8n.io/integrations/community-nodes/building-community-nodes/)
- [n8n: programmatic node tutorial](https://docs.n8n.io/connect/create-nodes/build-your-node/tutorial-build-a-programmatic-style-node/)
- [n8n: `$fromAI()`](https://docs.n8n.io/build/integrate-ai/ai-examples/use-ai-for-parameters/)

## Licença

[MIT](LICENSE.md)
