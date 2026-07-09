import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { executeEndpoint, resourceOptions, resourceProperties } from './actions';

export class Digisac implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Digisac',
		name: 'digisac',
		icon: { light: 'file:digisac.png', dark: 'file:digisac.dark.png' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description:
			'Use every documented Digisac API request from the public Postman documentation. Choose a resource folder and operation, fill required path parameters and use the generated query/body fields first. Advanced JSON fields are available only when an operation needs a custom payload or unsupported filter. Built for AI Agents: operation descriptions include method, path, source folder, required path variables, query guidance, body fields and explicit reminders to use IDs returned by Digisac instead of inventing values.',
		defaults: {
			name: 'Digisac',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: {
			replacements: {
				description:
					'Ferramenta para executar chamadas documentadas da API Digisac dentro do n8n. Use somente para tarefas de Digisac, como consultar, criar ou alterar contatos, chamados, mensagens, campanhas, conexoes, departamentos, usuarios, tags, templates, webhooks, relatorios e estatisticas. Primeiro escolha Resource e Operation; a Operation informa metodo HTTP, endpoint, origem na documentacao, parametros obrigatorios, query e body. Nunca invente IDs: qualquer campo terminado em Id ou Ids deve vir de busca/listagem anterior, entrada confirmada do usuario ou valor sentinela documentado como all. Preencha campos dedicados de path, query e Campos do Body; deixe campos vazios quando nao souber. Nao copie placeholders da documentacao como {{contactId}} ou {{all/open/close}}; substitua por valor real ou escolha uma opcao valida. Use Query Avancada JSON ou Body JSON Avancado apenas quando nao existir campo dedicado suficiente. Antes de enviar mensagem, excluir, arquivar, bloquear, fechar chamado, transferir chamado ou alterar dados, confirme que a intencao do usuario esta explicita.',
			},
		},
		credentials: [
			{
				name: 'digisacApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: resourceOptions,
				default: resourceOptions[0]?.value ?? '',
				description:
					'Area da API Digisac agrupada pela documentacao Postman. Resources Popular sao atalhos para operacoes frequentes; resources General contem o catalogo mais completo. Se a mesma chamada existir em Popular e General, prefira Popular para fluxos comuns e General quando precisar de uma chamada que nao existe no Popular.',
			},
			...resourceProperties,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				const responseData = await executeEndpoint.call(this, operation, i);
				const asArray = Array.isArray(responseData) ? responseData : [responseData];

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(asArray as IDataObject[]),
					{ itemData: { item: i } },
				);
				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
