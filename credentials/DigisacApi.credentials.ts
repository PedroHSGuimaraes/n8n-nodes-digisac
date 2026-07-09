import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class DigisacApi implements ICredentialType {
	name = 'digisacApi';

	displayName = 'Digisac API';

	icon = { light: 'file:digisac.png', dark: 'file:digisac.dark.png' } as const;

	documentationUrl = 'https://documenter.getpostman.com/view/53282970/2sBXihpXmF';

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: '',
			required: true,
			placeholder: 'https://your-company.digisac.app',
			description:
				'The Digisac API base URL shown in Digisac under Account > Information. Do not include a trailing slash. The node appends paths such as /api/v1/contacts automatically.',
		},
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'Bearer token generated in Digisac under Account > API > Personal access tokens. It uses the same permissions as the user who created it.',
		},
		{
			displayName: 'PDF/Base URL',
			name: 'pdfBaseUrl',
			type: 'string',
			default: '',
			placeholder: 'https://your-company.digisac.app',
			description:
				'Optional base URL for endpoints documented with the URLbase variable, such as ticket PDF export. Leave empty to reuse Base URL.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.accessToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl.replace(/\\/$/, "")}}',
			url: '/api/v1/me',
		},
	};
}
