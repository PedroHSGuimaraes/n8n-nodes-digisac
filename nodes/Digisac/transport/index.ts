import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

import { trimTrailingSlash } from '../helpers/format';

// Tempo máximo de espera por resposta do Digisac, em milissegundos. 30 s cobre exportações
// (CSV/PDF) sem prender o workflow para sempre se o serviço travar.
export const DIGISAC_REQUEST_TIMEOUT_MS = 30000;

export type DigisacResponseFormat = 'json' | 'text';

export interface DigisacRequestConfig {
	baseVariable?: 'URL' | 'URLbase' | '';
	absoluteUrl?: string;
	responseFormat?: DigisacResponseFormat;
}

// O `execute` e o `listSearch` chamam o mesmo transporte; os dois contextos têm credencial e helpers.
type DigisacContext = IExecuteFunctions | ILoadOptionsFunctions;

async function getBaseUrl(
	this: DigisacContext,
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
	this: DigisacContext,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject | IDataObject[] = {},
	qs: IDataObject = {},
	config: DigisacRequestConfig = {},
): Promise<unknown> {
	const responseFormat = config.responseFormat ?? 'json';
	const options: IHttpRequestOptions = {
		method,
		url: config.absoluteUrl || endpoint,
		qs,
		body,
		json: responseFormat === 'json',
		// Sem timeout, uma chamada pendurada travaria o item do workflow indefinidamente.
		timeout: DIGISAC_REQUEST_TIMEOUT_MS,
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
