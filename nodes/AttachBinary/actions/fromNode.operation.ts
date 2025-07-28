import { NodeApiError, updateDisplayOptions } from 'n8n-workflow';
import type {
	IBinaryKeyData,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	JsonObject,
} from 'n8n-workflow';

export const properties: INodeProperties[] = [
	{
		displayName: 'From Node',
		name: 'nodeName',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. Edit Fields',
		hint: 'Name of the node containing items with binaries',
	},
	{
		displayName: 'Attach',
		name: 'attach',
		type: 'options',
		default: 'all',
		options: [
			{
				name: 'All Binaries',
				value: 'all',
			},
			{
				name: 'Selected Binaries',
				value: 'selected',
			},
		],
	},
	{
		displayName: 'Binary Fields',
		name: 'binaryFields',
		type: 'string',
		default: '',
		placeholder: 'data',
		displayOptions: {
			show: {
				attach: ['selected'],
			},
		},
		hint: 'The names of the binaries in the selected node',
		description: 'Specify the binary fields to attach to the current item from the target node',
	},
	{
		displayName: 'Item Mapping',
		name: 'itemMapping',
		type: 'options',
		default: 'same',
		options: [
			{
				name: 'Same as Current Item',
				value: 'same',
			},
			{
				name: 'First Item',
				value: 'first',
			},
			{
				name: 'Specify Item Index',
				value: 'index',
			},
		],
	},
	{
		displayName: 'Item Index',
		name: 'itemIndex',
		type: 'number',
		default: 0,
		typeOptions: {
			minValue: 0,
			numberPrecision: 0,
		},
		displayOptions: {
			show: {
				itemMapping: ['index'],
			},
		},
		description: 'Index of the item to attach from the target node',
	},
];

const displayOptions = {
	show: {
		operation: ['fromNode'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, items: INodeExecutionData[]) {
	const returnData: INodeExecutionData[] = [];

	for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
		try {
			const nodeName = this.getNodeParameter('nodeName', itemIndex) as string;
			const itemMapping = this.getNodeParameter('itemMapping', itemIndex) as string;

			let index = itemIndex;

			if (itemMapping === 'first') {
				index = 0;
			}

			if (itemMapping === 'index') {
				index = Number(this.getNodeParameter('itemIndex', itemIndex));
			}

			const targetNodeData = this.evaluateExpression(
				`{{ $('${nodeName}').all()[${index}] }}`,
				0,
			) as INodeExecutionData;

			const newItem: INodeExecutionData = {
				json: {
					...items[itemIndex].json,
				},
				binary: {},
			};

			if (items[itemIndex].binary !== undefined) {
				Object.assign(newItem.binary as IBinaryKeyData, items[itemIndex].binary);
			}

			if (targetNodeData?.binary) {
				const attach = this.getNodeParameter('attach', itemIndex) as string;

				let binaryDataProperties: string[] = [];

				if (attach === 'all') {
					binaryDataProperties = Object.keys(targetNodeData.binary);
				}

				if (attach === 'selected') {
					const binaryFields = this.getNodeParameter('binaryFields', itemIndex) as
						| string
						| string[];

					if (typeof binaryFields === 'string') {
						binaryDataProperties = binaryFields.split(',').map((value) => value.trim());
					} else {
						binaryDataProperties = binaryFields;
					}
				}

				for (const property of binaryDataProperties) {
					if (targetNodeData.binary[property]) {
						let fieldName = property;

						if (targetNodeData.binary[property].fileName) {
							fieldName = property + '_' + nodeName;
						}

						newItem.binary![fieldName] = { ...targetNodeData.binary[property] };
					}
				}
			}

			returnData.push(newItem);
		} catch (error) {
			if (this.continueOnFail()) {
				returnData.push({
					json: {
						error: error.message,
					},
					pairedItem: {
						item: itemIndex,
					},
				});
				continue;
			}
			throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex });
		}
	}

	return returnData;
}
