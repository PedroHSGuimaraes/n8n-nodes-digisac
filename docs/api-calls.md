# Catálogo completo de chamadas Digisac

Este arquivo é gerado a partir da coleção pública Postman da Digisac e lista todas as chamadas incluídas no node n8n.

Fonte da API:

```text
https://documenter.getpostman.com/view/53282970/2sBXihpXmF
```

Resumo:

- Total de chamadas documentadas: 298
- Total de recursos/pastas no node: 51
- Métodos: GET: 144 | POST: 93 | PUT: 34 | PATCH: 1 | DELETE: 26

## Como ler esta tabela

- **ID** é o identificador interno da operação no node. Ele aparece apenas no código gerado; na interface do n8n o usuário escolhe pelo nome da operação.
- **Método** é o verbo HTTP usado pela API.
- **Caminho** é o endpoint chamado após a Base URL configurada na credencial.
- **Operação** é o nome herdado da documentação Postman.
- **Parâmetros detectados** mostra placeholders encontrados em path e query. IDs devem vir de operações de listagem/busca, nunca de valores inventados.

## Resumo por recurso

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

## Acionamento flag no robo (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e001` | `POST` | `/api/v1/bots/{{botId}}/trigger-signal/{{contactId}}` | Acionamento flag no robo | path:botId, path:contactId |

## Agendamentos (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e002` | `GET` | `/api/v1/schedule` | Listar agendamentos | - |
| `e003` | `GET` | `/api/v1/schedule/{{scheduleId}}` | Buscar agendamento | path:scheduleId |
| `e004` | `PUT` | `/api/v1/schedule/{{scheduleId}}` | Editar agendamento | path:scheduleId |
| `e005` | `POST` | `/api/v1/schedule` | Criar agendamento | - |
| `e006` | `DELETE` | `/api/v1/schedule/{{scheduleId}}` | Excluir agendamento | path:scheduleId |

## Agora (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e007` | `GET` | `/api/v1/now/departments-resume` | Buscar departamentos (Agora) | - |
| `e008` | `GET` | `/api/v1/now/attendance-resume` | Buscar atendentes (Agora) | - |
| `e009` | `GET` | `/api/v1/now/resume` | Buscar todos os dados (Agora) | - |

## Agora (Popular)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e243` | `GET` | `/api/v1/now/departments-resume` | Buscar departamentos (Agora) | - |
| `e244` | `GET` | `/api/v1/now/attendance-resume` | Buscar atendentes (Agora) | - |
| `e245` | `GET` | `/api/v1/now/resume` | Buscar todos os dados (Agora) | - |

## Assuntos de chamado (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e010` | `GET` | `/api/v1/ticket-topics` | Listar assuntos de fechamento | - |
| `e011` | `GET` | `/api/v1/ticket-topics/{{ticketTopicId}}` | Buscar um assunto especifico | path:ticketTopicId |
| `e012` | `PUT` | `/api/v1/ticket-topics/{{ticketTopicId}}` | Editar assunto especifico | path:ticketTopicId |
| `e013` | `POST` | `/api/v1/ticket-topics` | Criar assunto | - |
| `e014` | `DELETE` | `/api/v1/ticket-topics/{{ticketTopicId}}` | Excluir assunto especifico | path:ticketTopicId |

## Auditoria de autenticacao (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e015` | `GET` | `/api/v1/auth-history` | Listar auditorias de autenticacao | - |
| `e016` | `GET` | `/api/v1/auth-history/{{authId}}` | Buscar auditoria de autenticacao | path:authId |

## Autorizacao (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e017` | `POST` | `/api/v1/oauth/token` | Gerar Token de acesso | - |

## Autorizacao (Popular)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e246` | `POST` | `/api/v1/oauth/token` | Gerar Token de acesso | - |

## Avaliacoes (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e018` | `GET` | `/api/v1/questions` | Listar avaliacoes | - |
| `e019` | `GET` | `/api/v1/questions/{{questionId}}` | Buscar avaliacao | path:questionId |
| `e020` | `PUT` | `/api/v1/questions/{{questionId}}` | Editar avaliacao | path:questionId |
| `e021` | `POST` | `/api/v1/questions` | Criar avaliacao | - |
| `e022` | `DELETE` | `/api/v1/questions/{{questionId}}` | Excluir avaliacao | path:questionId |

## Campanhas (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e023` | `GET` | `/api/v1/campaigns` | Listar campanhas | - |
| `e024` | `GET` | `/api/v1/campaigns/{{campaignsId}}` | Buscar campanha | path:campaignsId |
| `e025` | `GET` | `/api/v1/campaigns/{{campaignId}}/stats` | Extrair status de uma campanha | path:campaignId |
| `e026` | `GET` | `/api/v1/campaigns` | Visualizar quem criou e enviou uma campanha | - |
| `e027` | `PUT` | `/api/v1/campaigns/{{campaignsId}}` | Editar campanha | path:campaignsId |
| `e028` | `POST` | `/api/v1/campaigns/export/csv` | Exportar resultados da campanha | - |
| `e029` | `DELETE` | `/api/v1/campaigns/{{campaignsId}}` | Excluir campanha | path:campaignsId |

## Campos personalizados (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e030` | `GET` | `/api/v1/custom-fields` | Listar campos personalizados | - |
| `e031` | `GET` | `/api/v1/custom-fields/{{customFieldsId}}` | Buscar campo personalizado | path:customFieldsId |
| `e032` | `PUT` | `/api/v1/custom-fields/{{customFieldsId}}` | Editar campo personalizado | path:customFieldsId |
| `e033` | `POST` | `/api/v1/custom-fields` | Criar campo personalizado | - |
| `e034` | `DELETE` | `/api/v1/custom-fields/{{customFieldsId}}` | Excluir campo personalizado | path:customFieldsId |

## Cargos (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e035` | `GET` | `/api/v1/roles` | Listar cargos | - |
| `e036` | `GET` | `/api/v1/roles/{{roleId}}` | Buscar cargo | path:roleId |
| `e037` | `GET` | `/api/v1/roles/{{roleId}}` | Buscar permissoes do cargo | path:roleId |
| `e038` | `GET` | `/api/v1/users/{{roleId}}` | Buscar cargos do usuario | path:roleId |
| `e039` | `PUT` | `/api/v1/roles/{{roleId}}` | Editar cargo | path:roleId |
| `e040` | `POST` | `/api/v1/roles` | Criar cargo | - |
| `e041` | `DELETE` | `/api/v1/roles/{{roleId}}` | Excluir cargo | path:roleId |

## Central de notificacoes (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e042` | `GET` | `/api/v1/notifications` | Listar central de notificacoes | - |
| `e043` | `GET` | `/api/v1/notifications/read-all` | Marcar todas as notificacoes como lidas | - |

## Chamados (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e044` | `GET` | `/api/v1/tickets` | Buscar chamados do contato | query:contactId |
| `e045` | `GET` | `/api/v1/tickets` | Buscar pelo contactid todos os chamados do cliente trazendo quem encerrou/transferiu | query:contactId |
| `e046` | `POST` | `/api/v1/contacts/{{contactId}}/ticket/transfer` | Transferencia de chamado | path:contactId |
| `e047` | `POST` | `/api/v1/contacts/ticket/bulk-transfer` | Transferencia de Transferencia em massa | - |
| `e048` | `POST` | `/api/v1/contacts/{{contactId}}/ticket/transfer` | Abertura de chamado | path:contactId |
| `e049` | `POST` | `/api/v1/contacts/{{contactId}}/ticket/close` | Fechar chamado | path:contactId |
| `e050` | `POST` | `/api/v1/contacts/{{contactId}}/ticket/close` | Fechar um chamado com assunto | path:contactId |

## Chamados (Popular)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e247` | `GET` | `/tickets` | Buscar chamados do contato | query:contactId |
| `e248` | `GET` | `/api/v1/tickets` | Buscar pelo contactid todos os chamados do cliente trazendo quem encerrou/transferiu | query:contactId |
| `e249` | `POST` | `/api/v1/contacts/{{contactId}}/ticket/transfer` | Transferencia de chamado | path:contactId |
| `e250` | `POST` | `/contacts/{{contactId}}/ticket/transfer` | Abertura de chamado | path:contactId |
| `e251` | `POST` | `/api/v1/contacts/{{contactId}}/ticket/close` | Fechar chamado | path:contactId |
| `e252` | `POST` | `/api/v1/contacts/{{contactId}}/ticket/close` | Fechar um chamado com assunto | path:contactId |

## Conexoes (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e051` | `GET` | `/api/v1/services` | Listar conexoes | - |
| `e052` | `GET` | `/api/v1/services/{{serviceId}}` | Buscar conexao | path:serviceId |
| `e053` | `GET` | `/api/v1/services` | Buscar conexoes ativas | - |
| `e054` | `PUT` | `/api/v1/services/{{serviceId}}` | Editar conexao | path:serviceId |
| `e055` | `POST` | `/api/v1/services/{{serviceId}}/archive` | Arquivar conexao | path:serviceId |
| `e056` | `POST` | `/api/v1/services` | Criar conexao | - |
| `e057` | `POST` | `/api/v1/services/{{serviceId}}/shutdown` | Desligar conexao | path:serviceId |
| `e058` | `POST` | `/api/v1/services/{{serviceId}}/start` | Iniciar conexao | path:serviceId |
| `e059` | `POST` | `/api/v1/services/{{serviceId}}/restart` | Reiniciar conexao | path:serviceId |
| `e060` | `POST` | `/api/v1/services/{{serviceId}}/logout` | Gerar QR Code | path:serviceId |
| `e061` | `DELETE` | `/api/v1/services/{{serviceId}}` | Excluir conexao | path:serviceId |

## Contatos (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e062` | `GET` | `/api/v1/contacts` | Listar todos os contatos | - |
| `e063` | `GET` | `/api/v1/contacts` | Listar contatos da conexao | query:serviceId |
| `e064` | `GET` | `/api/v1/contacts/{{contactId}}` | Buscar contato | path:contactId |
| `e065` | `GET` | `/api/v1/contacts` | Buscar contato por numero de uma conexao especifica | query:number, query:serviceId |
| `e066` | `GET` | `/api/v1/contacts/{{contactId}}` | Buscar tags vinculadas a um contato | path:contactId |
| `e067` | `GET` | `/api/v1/contacts` | Buscar contatos vinculados ao Campo Personalizado | query:customFieldName |
| `e068` | `GET` | `/api/v1/contacts` | Busca de contatos que possuem X campos personalizados preenchidos | query:customFieldName1, query:customFieldName2, query:customFieldName3, query:customFieldName4 |
| `e069` | `GET` | `/api/v1/contacts` | Buscar contatos vinculados a Organizacao | query:organizationId |
| `e070` | `GET` | `/api/v1/contacts` | Buscar contatos vinculados a Pessoa | query:personId |
| `e071` | `PUT` | `/api/v1/contacts/{{contactId}}` | Editar contato | path:contactId |
| `e072` | `PUT` | `/api/v1/contacts/{{contactId}}` | Editar tag do contato | path:contactId |
| `e073` | `PUT` | `/api/v1/contacts/{{contactId}}` | Editar campo personalizado de um contato | path:contactId |
| `e074` | `PUT` | `/api/v1/contacts/{{contactId}}` | Incluir tags em um contato existente | path:contactId |
| `e075` | `POST` | `/api/v1/contacts` | Cadastrar contato | - |
| `e076` | `POST` | `/api/v1/contacts/many` | Cadastrar multiplos contatos | - |
| `e077` | `POST` | `/api/v1/contacts/export/csv` | Exportar contatos | - |
| `e078` | `POST` | `/api/v1/contacts/count` | Total de contatos com filtros | - |
| `e079` | `POST` | `/api/v1/contacts/{{contactId}}/sync` | Sincroniza contato | path:contactId |
| `e080` | `POST` | `/api/v1/contacts/{{contactId}}/block` | Bloquear contato | path:contactId |
| `e081` | `POST` | `/api/v1/contacts/{{contactId}}/block` | Desbloquear contato | path:contactId |
| `e082` | `DELETE` | `/api/v1/contacts/{{contactId}}` | Excluir contato | path:contactId |
| `e083` | `DELETE` | `/api/v1/contacts/many` | Exclui multiplos contatos | - |

## Contatos (Popular)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e253` | `GET` | `/api/v1/contacts` | Listar todos os contatos | - |
| `e254` | `GET` | `/api/v1/contacts` | Listar contatos da conexao | query:serviceId |
| `e255` | `GET` | `/api/v1/contacts/{{contactId}}` | Buscar contato | path:contactId |
| `e256` | `GET` | `/api/v1/contacts` | Buscar contato por numero de uma conexao especifica | query:number, query:serviceId |
| `e257` | `GET` | `/api/v1/contacts/{{contactId}}` | Buscar tags vinculadas a um contato | path:contactId |
| `e258` | `GET` | `/api/v1/contacts` | Buscar contatos que possuem campo personalizado especifico | query:customFieldName |
| `e259` | `GET` | `/api/v1/contacts/{{contactId}}` | Buscar campos personalizados de um contato especifico | path:contactId, query:customFieldName |
| `e260` | `GET` | `/api/v1/contacts` | Busca de contatos que possuem X campos personalizados preenchidos | query:customFieldName1, query:customFieldName2, query:customFieldName3, query:customFieldName4 |
| `e261` | `GET` | `/api/v1/contacts/exists` | Verifica a existencia de um contato | query:phoneNumber, query:serviceId |
| `e262` | `PUT` | `/api/v1/contacts/{{contactId}}` | Editar contato | path:contactId |
| `e263` | `PUT` | `/api/v1/contacts/{{contactId}}` | Editar tag do contato | path:contactId |
| `e264` | `PUT` | `/api/v1/contacts/{{contactId}}` | Editar campo personalizado de um contato | path:contactId |
| `e265` | `PUT` | `/api/v1/contacts/{{contactId}}` | Incluir tags em um contato existente Copy | path:contactId |
| `e266` | `POST` | `/api/v1/contacts` | Cadastrar contato | - |
| `e267` | `POST` | `/api/v1/contacts/many` | Cadastrar multiplos contatos | - |
| `e268` | `POST` | `/api/v1/contacts/export/csv` | Exportar contatos | - |
| `e269` | `POST` | `/api/v1/contacts/count` | Total de contatos com filtros | - |
| `e270` | `POST` | `/api/v1/contacts/{{contactId}}/sync` | Sincroniza contato | path:contactId |
| `e271` | `POST` | `/api/v1/contacts/{{contactId}}/block` | Bloquear contato | path:contactId |
| `e272` | `POST` | `/api/v1/contacts/{{contactId}}/block` | Desbloquear contato | path:contactId |
| `e273` | `DELETE` | `/api/v1/contacts/{{contactId}}` | Excluir contato | path:contactId |
| `e274` | `DELETE` | `/api/v1/contacts/many` | Exclui multiplos contatos | - |

## Controle de ausencia (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e084` | `GET` | `/api/v1/absence` | Listar ausencias | - |

## Creditos SMS (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e085` | `GET` | `/api/v1/credit-movements` | Listagem de creditos | - |
| `e086` | `GET` | `/api/v1/credit-movements/balances` | Balanco | - |
| `e087` | `GET` | `/api/v1/credit-movements/{{movementId}}` | Buscar uma movimentacao expecifica | path:movementId |

## Departamentos (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e088` | `GET` | `/api/v1/departments` | Listar departamentos | - |
| `e089` | `GET` | `/api/v1/departments/{{departmentId}}` | Buscar departamento | path:departmentId |
| `e090` | `PUT` | `/api/v1/departments/{{departmentId}}` | Editar departamento | path:departmentId |
| `e091` | `POST` | `/api/v1/departments` | Criar departamento | - |
| `e092` | `POST` | `/api/v1/departments/{{departmentId}}/archive` | Arquivar departamento | path:departmentId |
| `e093` | `DELETE` | `/api/v1/departments/{{departmentId}}` | Excluir departamento | path:departmentId |

## Distribuicao de chamados (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e094` | `GET` | `/api/v1/distribution` | Listas distribuicoes de chamados | - |
| `e095` | `GET` | `/api/v1/distribution/{{distributionId}}` | Buscar distribuicao de chamados | path:distributionId |
| `e096` | `PUT` | `/api/v1/distribution/{{distributionId}}` | Editar distribuicao de chamados | path:distributionId |
| `e097` | `POST` | `/api/v1/distribution` | Criar distribuicao de chamados - Fila | - |
| `e098` | `POST` | `/api/v1/distribution` | Criar distribuicao de chamados - Padrao | - |
| `e099` | `DELETE` | `/api/v1/distribution/{{distributionId}}` | Excluir distribuicao de chamados | path:distributionId |

## Estatisticas de atendimento (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e100` | `GET` | `/api/v1/dashboard/general` | Buscar estatisticas por periodo | - |
| `e101` | `GET` | `/api/v1/dashboard/general` | Buscar estatisticas por conexao | query:serviceId |
| `e102` | `GET` | `/api/v1/dashboard/general` | Buscar estatisticas por departamento | query:departmentId |
| `e103` | `GET` | `/api/v1/dashboard/general` | Buscar estatisticas por usuario | query:userId |
| `e104` | `GET` | `/api/v1/dashboard/general` | Buscar estatisticas por dpt + usuario | query:departmentId, query:userId |
| `e105` | `GET` | `/api/v1/dashboard/general` | Buscar estatisticas por data de abertura | - |
| `e106` | `GET` | `/api/v1/dashboard/general` | Buscar estatisticas por data de fechamento | - |
| `e107` | `GET` | `/api/v1/dashboard/general` | Buscar estatisticas dos chamados abertos | - |
| `e108` | `GET` | `/api/v1/dashboard/general` | Buscar estatisticas dos chamados fechados | - |
| `e109` | `GET` | `/api/v1/dashboard/general` | Buscar estatisticas com todos os filtros ativos | query:departmentId, query:userId, query:serviceId |

## Estatisticas de atendimento (Popular)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e275` | `GET` | `/api/v1/dashboard/general` | Buscar estatisticas por periodo | - |
| `e276` | `GET` | `/api/v1/dashboard/general` | Buscar estatisticas pela conexao | query:serviceId |
| `e277` | `GET` | `/api/v1/dashboard/general` | Buscar estatisticas por departamento | query:departmentId |
| `e278` | `GET` | `/api/v1/dashboard/general` | Buscar estatisticas por usuario | query:userId |
| `e279` | `GET` | `/api/v1/dashboard/general` | Buscar estatisticas por departamento + usuario | query:departmentId, query:userId |
| `e280` | `GET` | `/api/v1/dashboard/general` | Buscar estatisticas pelo status dos chamados | - |
| `e281` | `GET` | `/api/v1/dashboard/general` | Buscar estatisticas com todos os filtros ativos | query:departmentId, query:userId, query:serviceId |

## Estatisticas de avaliacoes (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e110` | `GET` | `/api/v1/answers` | Buscar avaliacoes sem filtro | - |
| `e111` | `GET` | `/api/v1/answers/overview` | Buscar avaliacoes por periodo | - |
| `e112` | `GET` | `/api/v1/answers/overview` | Buscar avaliacoes por conexao | query:serviceId |
| `e113` | `GET` | `/api/v1/answers/overview` | Buscar avaliacoes por departamento | query:departmentId |
| `e114` | `GET` | `/api/v1/answers/overview` | Buscar avaliacoes por usuario | query:userId |
| `e115` | `GET` | `/api/v1/answers/overview` | Buscar avaliacoes por dpt + usuario | query:userId, query:departmentId |
| `e116` | `GET` | `/api/v1/answers/overview` | Buscar avaliacoes com todos os filtros ativos | query:userId, query:departmentId, query:serviceId |

## Feriados (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e117` | `GET` | `/api/v1/holiday` | Listar feriados | - |
| `e118` | `GET` | `/api/v1/holiday/{{holidayId}}` | Buscar feriado | path:holidayId |
| `e119` | `PUT` | `/api/v1/holiday/{{holidayId}}` | Editar feriado | path:holidayId |
| `e120` | `POST` | `/api/v1/holiday` | Criar feriado | - |
| `e121` | `DELETE` | `/api/v1/holiday/{{holidayId}}` | Excluir feriado | path:holidayId |

## Funil de vendas (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e122` | `GET` | `/api/v1/pipelines` | Listar funis de vendas | - |
| `e123` | `GET` | `/api/v1/pipelines/{{pipelineId}}` | Buscar funil de vendas | path:pipelineId |
| `e124` | `POST` | `/api/v1/pipelines` | Criar funil de vendas | - |
| `e125` | `PUT` | `/api/v1/pipelines/{{pipelineId}}` | Editar funil de vendas | path:pipelineId |
| `e126` | `DELETE` | `/api/v1/pipelines/{{pipelineId}}` | Apagar funil de vendas | path:pipelineId |
| `e127` | `GET` | `/api/v1/cards` | Listar oportunidades | query:pipelineId |
| `e128` | `GET` | `/api/v1/cards/{{cardsId}}` | Buscar oportunidades | path:cardsId |
| `e129` | `POST` | `/v1/cards` | Criar oportunidade | - |
| `e130` | `PUT` | `/v1/cards/{{cardsId}}` | Editar oportunidade | path:cardsId |
| `e131` | `DELETE` | `/v1/cards/{{cardsId}}` | Apagar oportunidade | path:cardsId |

## Grupos WhatsApp (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e132` | `POST` | `/api/v1/contacts/{{contactId}}/add-members` | Adicionar participante | path:contactId |
| `e133` | `POST` | `/api/v1/contacts/{{contactId}}/promote-members` | Atribuir cargo de administrador | path:contactId |
| `e134` | `POST` | `/api/v1/contacts` | Criar novo grupo | - |
| `e135` | `POST` | `/api/v1/contacts/{{contactId}}/demote-members` | Remover permissoes de administrador | path:contactId |

## Historico de chamados (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e136` | `GET` | `/api/v1/tickets` | Buscar chamados abertos por contactid | query:contactId |
| `e137` | `GET` | `/api/v1/tickets` | Buscar chamados abertos por departamento | query:departmentId |
| `e138` | `GET` | `/api/v1/tickets/{{ticketId}}` | Buscar por um chamado especifico | path:ticketId |
| `e139` | `GET` | `/api/v1/tickets` | Buscar chamados por periodo | - |
| `e140` | `GET` | `/api/v1/tickets` | Buscar chamados abertos por conexao | query:serviceId |
| `e141` | `GET` | `/api/v1/tickets` | Buscar chamados fechados por conexao | query:serviceId |
| `e142` | `GET` | `/api/v1/tickets` | Buscar chamados abertos + fechados por conexao | query:serviceId |
| `e143` | `GET` | `/api/v1/tickets` | Buscar todos os chamados da plataforma | - |
| `e144` | `GET` | `/pdf/tickets/{{ticketId}}/pt-BR` | Exportar historico de chamados em PDF | path:ticketId |
| `e145` | `POST` | `/api/v1/tickets/export` | Exportar historico de chamados em TXT | - |
| `e146` | `POST` | `/api/v1/tickets/export-history` | Exportar historico de chamados em CSV | - |
| `e147` | `POST` | `/api/v1/tickets/export-history` | Exportar historico de chamados de uma conexao especifica em CSV | query:servieId |

## Historico de chamados (Popular)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e282` | `GET` | `/api/v1/tickets/{{ticketId}}` | Buscar por um chamado especifico | path:ticketId |
| `e283` | `GET` | `/api/v1/tickets` | Buscar chamados por periodo | - |
| `e284` | `GET` | `/api/v1/tickets` | Buscar chamados abertos por conexao | query:serviceId |
| `e285` | `GET` | `/api/v1/tickets` | Buscar chamados fechados por conexao | query:serviceId |
| `e286` | `GET` | `/api/v1/tickets` | Buscar chamados abertos + fechados por conexao | query:serviceId |
| `e287` | `GET` | `/api/v1/tickets` | Buscar todos os chamados da plataforma | - |
| `e288` | `GET` | `/pdf/tickets/{{ticketId}}/pt-BR` | Exportar historico de chamados em PDF | path:ticketId |
| `e289` | `POST` | `/api/v1/tickets/export` | Exportar historico de chamados em TXT | - |
| `e290` | `POST` | `/api/v1/tickets/export-history` | Exportar historico de chamados em CSV | - |

## Idioma da plataforma (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e150` | `PUT` | `/api/v1/me` | Editar idioma da plataforma | - |

## Integracoes (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e148` | `GET` | `/api/v1/integrations` | Listar integracoes | - |
| `e149` | `GET` | `/api/v1/integrations/{{integrationId}}` | Buscar integracao | path:integrationId |

## Mensagens (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e151` | `GET` | `/api/v1/messages` | Listar mensagens | - |
| `e152` | `GET` | `/api/v1/messages` | Buscar total de mensagens do contato | query:contactId |
| `e153` | `GET` | `/api/v1/messages/{{messageId}}` | Buscar mensagem include=file | path:messageId |
| `e154` | `POST` | `/api/v1/messages` | Enviar mensagem para contato ja cadastrado | - |
| `e155` | `POST` | `/api/v1/messages` | Enviar mensagem para contato nao cadastrado | - |
| `e156` | `POST` | `/api/v1/messages` | Enviar mensagem SEM abrir o chamado | - |
| `e157` | `POST` | `/api/v1/messages` | Enviar comentario | - |
| `e158` | `POST` | `/api/v1/messages` | Enviar de mensagem usando bot e sem abrir chamado | - |
| `e159` | `POST` | `/api/v1/messages` | Enviar imagem | - |
| `e160` | `POST` | `/api/v1/messages` | Enviar PDF | - |
| `e161` | `POST` | `/api/v1/messages` | Enviar audio | - |
| `e162` | `POST` | `/api/v1/messages/{{messageId}}/send-reaction` | Reagir a uma mensagem | path:messageId |
| `e163` | `PATCH` | `/api/v1/messages/messageId` | Editar mensagem | - |

## Mensagens (Popular)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e291` | `POST` | `/api/v1/messages` | Enviar mensagem | - |
| `e292` | `POST` | `/api/v1/messages` | Enviar mensagem SEM abrir o chamado | - |
| `e293` | `POST` | `/api/v1/messages` | Enviar comentario (POST /api/v1/messages) | - |
| `e294` | `POST` | `/api/v1/messages` | Enviar de mensagem usando bot e sem abrir chamado | - |
| `e295` | `POST` | `/api/v1/messages` | Enviar imagem | - |
| `e296` | `POST` | `/api/v1/messages` | Enviar PDF | - |
| `e297` | `POST` | `/api/v1/messages` | Enviar comentario (POST /api/v1/messages) | - |
| `e298` | `POST` | `/api/v1/messages` | Enviar audio | - |

## Mensagens interativas (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e164` | `GET` | `/api/v1/interactive-messages` | Listar mensagens interativas | - |
| `e165` | `GET` | `/api/v1/interactive-messages/{{interactiveMessagesId}}` | Buscar mensagem interativa | path:interactiveMessagesId |
| `e166` | `POST` | `/api/v1/interactive-messages` | Criar mensagem interativa em lista | - |
| `e167` | `POST` | `/api/v1/interactive-messages` | Criar mensagem interativa com imagem | - |
| `e168` | `POST` | `/api/v1/messages` | Enviar mensagem interativa com botao | - |
| `e169` | `POST` | `/api/v1/messages` | Enviar mensagem interativa | - |
| `e170` | `DELETE` | `/api/v1/interactive-messages/{{interactiveMessagesId}}` | Excluir mensagem interativa | path:interactiveMessagesId |

## Meus dados (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e171` | `GET` | `/api/v1/me` | Buscar meus dados | - |

## Notificacao (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e172` | `PUT` | `/api/v1/contacts/{{contactId}}` | Marcar como nao lido | path:contactId |
| `e173` | `PUT` | `/api/v1/contacts/{{contactId}}` | Notificacao mensagens receptivas | path:contactId |
| `e174` | `PUT` | `/api/v1/contacts/{{contactId}}` | Silenciar contato | path:contactId |

## Organizacoes (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e175` | `GET` | `/api/v1/organizations` | Listar organizacoes | - |
| `e176` | `GET` | `/api/v1/organizations/{{organizationId}}` | Buscar organizacao | path:organizationId |
| `e177` | `PUT` | `/api/v1/organizations/{{organizationId}}` | Editar organizacao | path:organizationId |
| `e178` | `POST` | `/api/v1/organizations` | Criar organizacao | - |
| `e179` | `DELETE` | `/api/v1/organizations/{{organizationId}}` | Excluir organizacao | path:organizationId |

## Pessoas (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e180` | `GET` | `/api/v1/people` | Listar pessoas | - |
| `e181` | `GET` | `/api/v1/people/{{peopleId}}` | Buscar pessoa | path:peopleId |
| `e182` | `PUT` | `/api/v1/people/{{peopleId}}` | Editar pessoa | path:peopleId |
| `e183` | `POST` | `/api/v1/people` | Criar pessoa | - |
| `e184` | `DELETE` | `/api/v1/people/{{peopleId}}` | Excluir pessoa | path:peopleId |

## Planos (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e185` | `GET` | `/api/v1/plans` | Listar planos | - |
| `e186` | `GET` | `/api/v1/plans/{{planId}}` | Buscar plano | path:planId |

## Redefinir senha (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e187` | `POST` | `/api/v1/reset-password/request` | Solicitar uma nova senha | - |

## Respostas rapidas (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e188` | `GET` | `/api/v1/quick-replies` | Listar respostas rapidas | - |
| `e189` | `GET` | `/api/v1/quick-replies` | Listar textos e departamentos das respostas rapidas | - |
| `e190` | `GET` | `/api/v1/quick-replies` | Listar somente os textos das respostas rapidas | - |
| `e191` | `GET` | `/api/v1/quick-replies/{{quickRepliesId}}` | Buscar resposta rapida | path:quickRepliesId |
| `e192` | `PUT` | `/api/v1/quick-replies/{{quickRepliesId}}` | Editar resposta rapida | path:quickRepliesId |
| `e193` | `POST` | `/api/v1/quick-replies` | Criar resposta rapida | - |
| `e194` | `DELETE` | `/api/v1/quick-replies/{{quickRepliesId}}` | Excluir resposta rapida | path:quickRepliesId |

## Robos (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e195` | `GET` | `/api/v1/bots` | Listar bots V1 / V2 / V3 | - |
| `e196` | `GET` | `/api/v1/bots` | Listar bots V1 / V2 | - |
| `e197` | `GET` | `/api/v1/bots` | Listar bots V3 | - |
| `e198` | `GET` | `/api/v1/bots/{{botId}}` | Buscar bot | path:botId |
| `e199` | `PUT` | `/api/v1/bots/{{botId}}` | Editar bot | path:botId |
| `e200` | `DELETE` | `/api/v1/bots/{{botId}}` | Excluir bot | path:botId |

## Tags (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e201` | `GET` | `/api/v1/tags` | Listar tags | - |
| `e202` | `GET` | `/api/v1/tags/{{tagId}}` | Buscar tag | path:tagId |
| `e203` | `GET` | `/api/v1/contacts/{{contactId}}` | Buscar tags vinculadas a um contato | path:contactId |
| `e204` | `PUT` | `/api/v1/tags/{{tagId}}` | Editar tag | path:tagId |
| `e205` | `POST` | `/api/v1/tags` | Criar tag | - |
| `e206` | `POST` | `/api/v1/tags/{{tagId}}/contacts` | Adicona uma tag a multiplos contatos | path:tagId |
| `e207` | `DELETE` | `/api/v1/tags/{{tagId}}/contacts` | Remove uma tag a multiplos contatos | path:tagId |
| `e208` | `DELETE` | `/api/v1/tags/{{tagId}}` | Excluir tag | path:tagId |

## Templates (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e209` | `GET` | `/api/v1/whatsapp-business-templates` | Listar templates | - |
| `e210` | `GET` | `/api/v1/whatsapp-business-templates/{{templateId}}` | Buscar template | path:templateId |
| `e211` | `GET` | `/api/v1/whatsapp-business-templates/count` | Total de templates cadastrados | - |
| `e212` | `PUT` | `/api/v1/whatsapp-business-templates/{{templateId}}` | Editar template | path:templateId |
| `e213` | `POST` | `/api/v1/whatsapp-business-templates/{{hsmId}}/send-to-review` | Enviar template para aprovacao | path:hsmId |
| `e214` | `POST` | `/api/v1/whatsapp-business-templates/refresh-templates` | Sincronizar templates com o provedor | - |
| `e215` | `POST` | `/api/v1/messages` | Enviar template com botao | - |
| `e216` | `POST` | `/api/v1/messages` | Enviar template com URL no botao | - |
| `e217` | `POST` | `/api/v1/messages` | Envio de template com dois parametros | - |
| `e218` | `POST` | `/api/v1/whatsapp-business-templates` | Criar template somente com texto | - |
| `e219` | `DELETE` | `/api/v1/whatsapp-business-templates/{{templateId}}` | Excluir template | path:templateId |

## Termos de aceite (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e220` | `GET` | `/api/v1/acceptance-terms` | Listar termos de aceite | - |
| `e221` | `GET` | `/api/v1/acceptance-terms/{{termsId}}` | Buscar termo de aceite | path:termsId |
| `e222` | `PUT` | `/api/v1/acceptance-terms/{{termsId}}` | Editar termo de aceite | path:termsId |
| `e223` | `POST` | `/api/v1/acceptance-terms` | Criar termo de aceite | - |
| `e224` | `DELETE` | `/api/v1/acceptance-terms/{{termsId}}` | Excluir termo de aceite | path:termsId |

## Tokens (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e225` | `GET` | `/api/v1/me/tokens` | Listar tokens | - |
| `e226` | `GET` | `/api/v1/me/tokens/{{tokenId}}` | Buscar token | path:tokenId |
| `e227` | `PUT` | `/api/v1/me/tokens/{{tokenId}}` | Editar token | path:tokenId |
| `e228` | `POST` | `/api/v1/me/tokens` | Criar token | - |
| `e229` | `DELETE` | `/api/v1/me/tokens/{{tokenId}}` | Excluir token | path:tokenId |

## Usuarios (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e230` | `GET` | `/api/v1/users` | Listar usuarios | - |
| `e231` | `GET` | `/api/v1/users` | Listar usuarios com seus departamentos | - |
| `e232` | `GET` | `/api/v1/users/{{userId}}` | Buscar usuario | path:userId |
| `e233` | `PUT` | `/api/v1/users/{{userId}}` | Editar usuario | path:userId |
| `e234` | `POST` | `/api/v1/users` | Criar usuario | - |
| `e235` | `POST` | `/api/v1/users/{{userId}}/archive` | Arquiva usuario | path:userId |

## Versoes (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e236` | `GET` | `/api/v1/versions` | Versao da plataforma | - |

## Webhooks (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e237` | `GET` | `/api/v1/me/webhooks` | Listar webhooks | - |
| `e238` | `GET` | `/api/v1/me/webhooks/{{webhookId}}` | Buscar webhook | path:webhookId |
| `e239` | `PUT` | `/api/v1/me/webhooks/{{webhookId}}` | Editar webhook | path:webhookId |
| `e240` | `POST` | `/api/v1/me/webhooks` | Criar webhook | - |
| `e241` | `POST` | `{{link_Completo_Webhook}}` | Teste Webhook | - |

## WhatsApp (General)

| ID | Método | Caminho | Operação | Parâmetros detectados |
| --- | --- | --- | --- | --- |
| `e242` | `GET` | `/api/v1/contacts/exists` | Validacao WhatsApp | query:contactNumber, query:serviceId |
