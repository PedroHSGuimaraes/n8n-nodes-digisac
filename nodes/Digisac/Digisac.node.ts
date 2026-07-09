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
		usableAsTool: true,
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
					'Digisac API area, grouped from the Postman documentation. Pick the folder that matches the task: contacts, tickets, messages, campaigns, services, dashboards, webhooks, and more.',
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
