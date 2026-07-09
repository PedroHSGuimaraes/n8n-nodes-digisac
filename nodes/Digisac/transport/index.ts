import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

import { trimTrailingSlash } from '../helpers/format';

export type DigisacResponseFormat = 'json' | 'text';

export interface DigisacRequestConfig {
	baseVariable?: 'URL' | 'URLbase' | '';
	absoluteUrl?: string;
	responseFormat?: DigisacResponseFormat;
}

async function getBaseUrl(
	this: IExecuteFunctions,
	baseVariable: 'URL' | 'URLbase' | '' = 'URL',
): Promise<string> {
	const credentials = await this.getCredentials('digisacApi');
	const baseUrl = trimTrailingSlash((credentials?.baseUrl as string) ?? '');
	const pdfBaseUrl = trimTrailingSlash((credentials?.pdfBaseUrl as string) ?? '');

	if (baseVariable === 'URLbase' && pdfBaseUrl) {
		return pdfBaseUrl;
	}
	if (baseUrl) {
		return baseUrl;
	}

	throw new NodeOperationError(
		this.getNode(),
		'No Digisac Base URL found. Open the Digisac API credential and fill in Base URL.',
	);
}

export async function digisacApiRequest(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject | IDataObject[] = {},
	qs: IDataObject = {},
	config: DigisacRequestConfig = {},
): Promise<any> {
	const responseFormat = config.responseFormat ?? 'json';
	const options: IHttpRequestOptions = {
		method,
		url: config.absoluteUrl || endpoint,
		qs,
		body,
		json: responseFormat === 'json',
	};

	if (!config.absoluteUrl) {
		options.baseURL = await getBaseUrl.call(this, config.baseVariable ?? 'URL');
	}

	const hasBody = Array.isArray(body) ? body.length > 0 : Object.keys(body).length > 0;
	if (!hasBody) {
		delete options.body;
	}
	if (!Object.keys(qs).length) {
		delete options.qs;
	}

	try {
		return await this.helpers.httpRequestWithAuthentication.call(this, 'digisacApi', options);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}
