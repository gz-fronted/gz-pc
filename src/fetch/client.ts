import { message } from '@chenhui996/gg-ui';
import axios, { AxiosHeaders } from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';

import { toGzFetchError } from './error';
import {
  runErrorMiddlewares,
  runRequestMiddlewares,
  runResponseMiddlewares,
} from './middleware';
import type {
  CreateGzFetchOptions,
  GzFetchClient,
  GzInternalRequestConfig,
  GzRequestConfig,
  GzRequestOptions,
  GzResponseContext,
} from './types';

const DEFAULT_TIMEOUT = 15_000;
const DEFAULT_AUTH_HEADER = 'Authorization';

function toHeaderRecord(
  headers: AxiosResponse['headers'],
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [name, value] of Object.entries(headers)) {
    if (value !== undefined) {
      result[name] = String(value);
    }
  }

  return result;
}

export function createGzFetch(
  options: CreateGzFetchOptions = {},
): GzFetchClient {
  const middlewares = options.middlewares ?? [];
  const showInstanceErrorMessage = options.showErrorMessage ?? true;
  const headerName = options.auth?.headerName ?? DEFAULT_AUTH_HEADER;
  const formatToken =
    options.auth?.formatToken ?? ((token: string) => `Bearer ${token}`);

  const instance = axios.create({
    ...(options.baseURL === undefined ? {} : { baseURL: options.baseURL }),
    timeout: options.timeout ?? DEFAULT_TIMEOUT,
    validateStatus: (status) => status === 200,
  });

  async function request<TResponse, TRequestParams = unknown>(
    initialConfig: GzRequestConfig<TRequestParams>,
  ): Promise<TResponse> {
    let currentConfig: GzInternalRequestConfig = initialConfig;

    try {
      const headers = AxiosHeaders.from(initialConfig.headers);
      if (!initialConfig.skipAuth && options.getToken) {
        const token = await options.getToken();
        if (token) {
          headers.set(headerName, formatToken(token));
        }
      }

      currentConfig = await runRequestMiddlewares(
        { ...initialConfig, headers },
        middlewares,
      );

      const usesRequestBody =
        currentConfig.method === 'POST' || currentConfig.method === 'PUT';
      const axiosConfig: AxiosRequestConfig = {
        url: currentConfig.url,
        method: currentConfig.method,
        ...(!usesRequestBody || currentConfig.params === undefined
          ? {}
          : { data: currentConfig.params }),
        ...(currentConfig.headers === undefined
          ? {}
          : { headers: currentConfig.headers }),
        ...(usesRequestBody || currentConfig.params === undefined
          ? {}
          : { params: currentConfig.params }),
        ...(currentConfig.timeout === undefined
          ? {}
          : { timeout: currentConfig.timeout }),
        ...(currentConfig.responseType === undefined
          ? {}
          : { responseType: currentConfig.responseType }),
        ...(currentConfig.signal === undefined
          ? {}
          : { signal: currentConfig.signal }),
      };

      const response = await instance.request<TResponse>(axiosConfig);
      const context: GzResponseContext = {
        config: currentConfig,
        status: response.status,
        headers: toHeaderRecord(response.headers),
      };

      return await runResponseMiddlewares(response.data, context, middlewares);
    } catch (originalError) {
      const error = toGzFetchError(originalError);
      await runErrorMiddlewares(error, { config: currentConfig }, middlewares);

      const shouldShowError =
        currentConfig.showErrorMessage ?? showInstanceErrorMessage;
      if (shouldShowError && error.type !== 'CANCELED_ERROR') {
        message.error(error.message);
      }

      throw error;
    }
  }

  const gzFetch = (<TResponse, TRequestParams = unknown>(
    config: GzRequestConfig<TRequestParams>,
  ) => request<TResponse, TRequestParams>(config)) as GzFetchClient;

  gzFetch.get = <T>(url: string, config: GzRequestOptions = {}) =>
    gzFetch<T>({ ...config, url, method: 'GET' });

  gzFetch.post = <T, TRequestParams = unknown>(
    url: string,
    params?: TRequestParams,
    config: Omit<GzRequestOptions, 'params'> = {},
  ) =>
    gzFetch<T, TRequestParams>({
      ...config,
      url,
      method: 'POST',
      ...(params === undefined ? {} : { params }),
    });

  gzFetch.put = <T, TRequestParams = unknown>(
    url: string,
    params?: TRequestParams,
    config: Omit<GzRequestOptions, 'params'> = {},
  ) =>
    gzFetch<T, TRequestParams>({
      ...config,
      url,
      method: 'PUT',
      ...(params === undefined ? {} : { params }),
    });

  gzFetch.delete = <T>(url: string, config: GzRequestOptions = {}) =>
    gzFetch<T>({ ...config, url, method: 'DELETE' });

  return gzFetch;
}
