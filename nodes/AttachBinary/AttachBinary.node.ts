import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';

import * as fromNode from './actions/fromNode.operation';

export class AttachBinary implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Attach Binaries(Files)',
		name: 'attachBinary',
		icon: 'file:filesAttach.svg',
		group: ['input'],
		version: 1,
		subtitle: '={{ $parameter["operation"]}}',
		description: "Attach to the node's input items binary data from other nodes",
		defaults: {
			name: 'Attach Binaries(Files)',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'hidden',
				noDataExpression: true,
				options: [
					{
						name: 'Attach From Other Node',
						value: 'fromNode',
						description: 'Attach binary data from another node',
						action: 'Attach Binaries From Other Node',
					},
				],
				default: 'fromNode',
			},
			...fromNode.description,
		],
	};

	async execute(this: IExecuteFunctions) {
		const operation = 'fromNode';
		const items = this.getInputData();
		let returnData: INodeExecutionData[] = [];

		if (operation === 'fromNode') {
			returnData = await fromNode.execute.call(this, items);
		}

		return [returnData];
	}
}
