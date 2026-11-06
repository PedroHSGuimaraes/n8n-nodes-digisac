# n8n-nodes-digisac

Node community do [n8n](https://n8n.io/) para integrar seus fluxos com a **API do [Digisac](https://digisac.com.br)**, plataforma de atendimento multicanal (WhatsApp e outros canais).

[![CI](https://github.com/PedroHSGuimaraes/n8n-nodes-digisac/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/PedroHSGuimaraes/n8n-nodes-digisac/actions/workflows/ci.yml) [![Apoie no Buy Me a Coffee](https://img.shields.io/badge/Buy_Me_a_Coffee-Apoie_o_projeto-FFDD00?logo=buy-me-a-coffee&logoColor=000000)](https://buymeacoffee.com/qTny0AzFXS)

Um único node cobre **todas as chamadas da coleção Postman pública do Digisac**: contatos, chamados, mensagens, campanhas, conexões, departamentos, usuários, tags, templates, webhooks, relatórios, estatísticas, agendamentos e demais recursos.

[n8n](https://n8n.io/) é uma plataforma de automação de fluxos com [licença fair-code](https://docs.n8n.io/reference/license/).

[Instalação](#-instalação) · [Credenciais](#-credenciais) · [Nós e Operações](#-nós-e-operações) · [Exemplos](#-exemplos-práticos) · [Tool de IA](#-usar-como-tool-de-agente-de-ia) · [Versão 1 ou 2](#-versão-1-ou-2-do-node) · [Desenvolvimento](#️-desenvolvimento) · [Versões](#-versões) · [Apoie](#-apoie-o-projeto)

---

## 🚀 Funcionalidades

- **1 node unificado** — `Digisac` com seletor **Resource → Operation**. Cada operation é uma chamada real da API, com método, caminho e origem na documentação.
- **Cobertura completa** — 298 chamadas em 51 recursos, geradas da coleção pública Postman.
- **IDs em lista pesquisável (versão 2 do node)** — contato, conexão, departamento, usuário, tag, cargo, robô e assunto de chamado aparecem como lista da sua conta, com busca, e aceitam colar o ID. Os outros IDs aceitam colar o ID no mesmo formato.
- **Datas e opções guiadas (versão 2 do node)** — período, `From` e `To` têm seletor de data; `Status`, `Period Type`, `Type`, participações e `Origin` são listas de opções.
- **Workflows salvos não mudam** — quem já usa a versão 1 continua enviando a mesma requisição.
- **Credencial centralizada** — Base URL e token ficam na credencial `Digisac API`.
- **Usável como Tool de IA** — o node tem `usableAsTool`, com descrições pensadas para o agente entender método, caminho, parâmetros e cuidados. Veja [Usar como Tool de Agente de IA](#-usar-como-tool-de-agente-de-ia).
- **Zero dependências de runtime** — usa o `httpRequestWithAuthentication` do próprio n8n, com timeout de 30 s em toda chamada. Passa no lint oficial `n8n-node lint` e é publicado no npm **com provenance**.

## 📦 Instalação

No n8n, acesse **Settings → Community Nodes → Install** e instale:

```text
n8n-nodes-digisac
```

Para usar community nodes como Tools de Agente de IA em n8n self-hosted, habilite:

```bash
N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE=true
```

Sem essa variável, o node funciona como node normal, mas não aparece como tool no AI Agent em instalações self-hosted.

## 🔑 Credenciais

Crie uma credencial **Digisac API**.

| Campo | O que preencher | Onde encontrar |
| --- | --- | --- |
| **Base URL** | URL base da sua conta, sem barra final. Exemplo: `https://suaempresa.digisac.app`. | Digisac → Conta → Informações |
| **Access Token** | Token Bearer de acesso pessoal. Tem as mesmas permissões do usuário que o criou. | Digisac → Conta → API → Tokens de acesso pessoal |
| **PDF/Base URL** | Base opcional para endpoints documentados como `URLbase`, principalmente export de PDF. Se vazio, usa a Base URL. | Use só se sua instância separar a URL de API e a de PDF |

A credencial testa o acesso com `GET /api/v1/me`.

## 🧩 Nós e Operações

1. Adicione o node **Digisac** ao workflow.
2. Escolha o **Resource**. Ele corresponde a uma pasta da documentação, como `Contatos`, `Mensagens`, `Chamados`, `Campanhas`, `Tags`, `Usuários` ou `Webhooks`.
3. Escolha a **Operation**. Cada uma é uma chamada real da API.
4. Preencha os IDs de path. Na versão 2, escolha na lista ou cole o ID no modo **By ID**.
5. Preencha os campos de query que aparecerem, como `Per Page`, `Start Period`, `End Period`, `Status`.
6. Em chamadas `POST`, `PUT` e `PATCH`, use **Body Fields**: o node gera os campos a partir do body documentado.
7. Use **Use Body JSON Avancado** só quando a operação exigir array, objeto livre ou algo que não coube nos campos.
8. Use **Options → Query Avancada JSON** só para filtros sem campo dedicado.
9. Em exportações CSV, TXT ou PDF, use **Options → Response Format → Text**.

Resources **Popular** são atalhos herdados da coleção Postman para operações frequentes. Resources **General** têm o catálogo mais completo.

Regra para automações e Tools de IA: todo campo terminado em `Id` ou `Ids` deve vir de uma busca anterior, de uma entrada confirmada ou de um valor documentado, como `all`. Nunca copie placeholders como `{{contactId}}`.

| Campo | Uso |
| --- | --- |
| **Resource** | Área da API Digisac, gerada das pastas Postman. |
| **Operation** | Chamada exata da API. A descrição mostra método, endpoint e origem. |
| **IDs de path** | Obrigatórios, extraídos de placeholders como `{{contactId}}`. |
| **Campos de query** | Campos simples gerados da URL documentada. |
| **Body Fields** | Coleção gerada do body documentado para operações de escrita. |
| **Options → Response Format** | `Text` para respostas que não são JSON. |

### Todas as chamadas da API

O catálogo completo fica em [docs/api-calls.md](docs/api-calls.md). Resumo por método:

```text
GET: 144 | POST: 93 | PUT: 34 | PATCH: 1 | DELETE: 26
```

Resumo por recurso (gerado por `npm run generate:docs`):

<!-- digisac:recursos:start -->
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
<!-- digisac:recursos:end -->

## 💡 Exemplos práticos

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

Em **Body Fields**, preencha:

- `Text`: `Olá, tudo bem?`
- `Type`: `chat`
- `Contact Id`: `CONTACT_ID`
- `User Id`: `USER_ID`
- `Origin`: `bot`

### Enviar arquivo por mensagem

Resource: **Mensagens (General)**  
Operation: **Enviar imagem**, **Enviar PDF** ou **Enviar áudio**

Use **Body Fields** para `Text`, `Number` e `Service Id`. No campo `File`, informe somente o objeto do arquivo, não o body inteiro:

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

Em **Body Fields**, preencha `Ticket Topic Ids` com:

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

Em **Body Fields**, preencha `Active`, `Name`, `Url`, `Events` e `Type`. Para `Events`, use array JSON:

```json
["message.created", "ticket.closed"]
```

## 🤖 Usar como Tool de Agente de IA

O node pode ser conectado ao **AI Agent** do n8n como uma tool. A prática recomendada é criar uma tool por operação liberada para o agente. Isso limita o escopo do modelo e reduz risco de ações erradas.

### Prompt recomendado para o System Message

```text
Você pode usar as tools Digisac somente quando o usuário pedir para consultar, criar ou alterar dados na Digisac.
Nunca invente IDs. Qualquer campo terminado em Id ou Ids deve vir de busca/listagem anterior, entrada confirmada do usuário ou valor sentinela documentado como all.
Não copie placeholders da documentação, como {{contactId}}, {{serviceId}} ou {{all/open/close}}. Substitua por valor real ou escolha uma opção válida.
Para operações POST, PUT e PATCH, envie um body JSON mínimo, somente com os campos necessários.
Quando a tool expuser Body Fields, preencha os campos dedicados em vez de gerar um JSON manual.
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

## 🔀 Versão 1 ou 2 do node

| | **Versão 1** | **Versão 2 (padrão em node novo)** |
| --- | --- | --- |
| IDs | Texto digitado | Lista pesquisável (8 tipos) ou **By ID** (os demais) |
| Datas | Texto | Seletor de data, enviada em ISO UTC |
| Valores fixos | Texto | Lista de opções |
| Workflows salvos | Continuam iguais | Não são alterados |

Se um workflow salvo usa a versão 1, ele continua enviando exatamente a mesma requisição. Para ganhar os campos guiados, adicione um node novo (versão 2) e escolha o valor de novo.

## 🛠️ Desenvolvimento

```bash
# Instalar dependências
npm install

# Compilar (n8n-node build: tsc + cópia de ícones)
npm run build

# Testes (node --test sobre o dist)
npm test

# Lint oficial do n8n (n8n-node lint)
npm run lint
npm run lint:fix
```

Estrutura resumida:

```text
n8n-nodes-digisac/
├── credentials/        # DigisacApi.credentials.ts
├── nodes/Digisac/
│   ├── actions/        # monta propriedades e executa cada chamada
│   ├── generated/      # catálogo gerado da coleção Postman
│   ├── helpers/        # IDs guiados, datas e opções (versão 2)
│   ├── methods/        # listSearch das listas pesquisáveis
│   └── transport/      # requisição HTTP com timeout
├── scripts/            # geradores do catálogo e dos documentos
├── docs/               # api-calls.md (gerado)
└── test/               # node --test sobre o dist
```

Os geradores são manuais e **não** rodam no build (o primeiro baixa a coleção da rede):

```bash
npm run generate:endpoints   # baixa a coleção Postman e regrava o catálogo
npm run generate:docs        # regrava docs/api-calls.md e a tabela de recursos deste README
```

## ✅ Compatibilidade

- Requer n8n com `n8nNodesApiVersion` 1 e uma conta Digisac com token de acesso pessoal.
- A versão 2 do node é a padrão em node novo; a versão 1 continua disponível para workflows salvos.

## 📚 Recursos

- [Documentação Postman da Digisac](https://documenter.getpostman.com/view/53282970/2sBXihpXmF)
- [Documentação de community nodes do n8n](https://docs.n8n.io/integrations/community-nodes/)
- [n8n: `$fromAI()`](https://docs.n8n.io/build/integrate-ai/ai-examples/use-ai-for-parameters/)

## 🚀 Publicação

A tag `vX.Y.Z` dispara o workflow `publish.yml`, que envia a versão com `npm stage publish` e provenance. A versão **fica em espera**: ela só vai ao ar depois que o dono a aprova, com 2FA, na aba **Staged Packages** do npmjs.com. Sem a aprovação, nada muda no registro.

## 📈 Versões

- **1.1.0** — **IDs, datas e valores guiados.** Em node novo (versão 2 do node), contato, conexão, departamento, usuário, tag, cargo, robô e assunto aparecem em lista pesquisável; datas têm seletor; valores fixos viram opções. Workflows salvos continuam na versão 1. Migração para o `@n8n/node-cli` 0.55.5, lint oficial sem erros, testes, CI e timeout de 30 s. Veja o `CHANGELOG.md`.
- **1.0.3** — Descrições de AI Tool reforçadas: regra para campos `Id/Ids`, alertas para placeholders, orientação Popular vs General e avisos por tipo de campo.
- **1.0.2** — Interface simplificada: query e body com campos dedicados gerados da documentação. JSON fica em opções avançadas.
- **1.0.1** — Documentação em PT-BR, exemplos, instruções de AI Tool e catálogo em `docs/api-calls.md`.
- **1.0.0** — Primeira versão publicada: node único `Digisac`, credencial Bearer, 298 chamadas, suporte a AI Agent e publicação npm via GitHub Actions.

## 🆘 Suporte

Se algo não funcionar:

1. Confirme a **Base URL** e o **token** da credencial (o teste da credencial chama `GET /api/v1/me`).
2. Verifique se a versão do n8n é compatível.
3. Consulte os logs do n8n para o erro detalhado.
4. Abra uma [issue no GitHub](https://github.com/PedroHSGuimaraes/n8n-nodes-digisac/issues).

## ☕ Apoie o projeto

Este node é mantido de forma independente. Se ele ajuda suas automações, você pode apoiar o desenvolvimento, a manutenção e as novas integrações pelo [Buy Me a Coffee](https://buymeacoffee.com/qTny0AzFXS).

## 📄 Licença

[MIT](LICENSE.md)
