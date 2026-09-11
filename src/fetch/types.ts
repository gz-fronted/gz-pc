import type { AxiosHeaders } from 'axios';

import type { GzFetchError } from './error';

export type GzRequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
export type GzResponseType = 'json' | 'blob' | 'text';
export type GzRequestParams = Record<string, unknown>;
export type GzRequestHeaders =
  Record<string, string | number | boolean | null> | AxiosHeaders;

export interface GzRequestConfig<TRequestParams = unknown> {
  url: string;
  method: GzRequestMethod;
  params?: TRequestParams;
  paramsInUrl?: boolean;
  headers?: Record<string, string>;
  timeout?: number;
  showErrorMessage?: boolean;
  skipAuth?: boolean;
  responseType?: GzResponseType;
  signal?: AbortSignal;
  withCredentials?: boolean;
}

export interface GzInternalRequestConfig extends Omit<
  GzRequestConfig<unknown>,
  'headers'
> {
  headers?: GzRequestHeaders;
}

export type GzRequestOptions<TRequestParams = unknown> = Omit<
  GzRequestConfig<TRequestParams>,
  'url' | 'method'
>;

export interface GzResponseContext {
  config: Readonly<GzInternalRequestConfig>;
  status: number;
  headers: Readonly<Record<string, string>>;
}

export interface GzErrorContext {
  config: Readonly<GzInternalRequestConfig>;
}

export interface GzFetchMiddleware {
  onRequest?: (
    config: GzInternalRequestConfig,
  ) => GzInternalRequestConfig | Promise<GzInternalRequestConfig>;
  onResponse?: <T>(data: T, context: GzResponseContext) => T | Promise<T>;
  onError?: (
    error: GzFetchError,
    context: GzErrorContext,
  ) => void | Promise<void>;
}

export interface GzFetchAuthOptions {
  headerName?: string;
  formatToken?: (token: string) => string;
}

export interface GzFetchUnauthorizedOptions {
  enabled?: boolean;
  loginUrl?: string;
  modalTitle?: string;
  modalMessage?: string;
  onUnauthorized?: () => void;
}

export interface CreateGzFetchOptions {
  baseURL?: string;
  timeout?: number;
  validateStatus?: (status: number) => boolean;
  getToken?: () => string | undefined | Promise<string | undefined>;
  showErrorMessage?: boolean;
  auth?: GzFetchAuthOptions;
  unauthorized?: GzFetchUnauthorizedOptions;
  middlewares?: readonly GzFetchMiddleware[];
}

export interface GzFetchClient {
  <TResponse, TRequestParams = unknown>(
    config: GzRequestConfig<TRequestParams>,
  ): Promise<TResponse>;
  get<T>(url: string, config?: GzRequestOptions): Promise<T>;
  post<T, TRequestParams = unknown>(
    url: string,
    params?: TRequestParams,
    config?: Omit<GzRequestOptions, 'params'>,
  ): Promise<T>;
  put<T, TRequestParams = unknown>(
    url: string,
    params?: TRequestParams,
    config?: Omit<GzRequestOptions, 'params'>,
  ): Promise<T>;
  delete<T>(url: string, config?: GzRequestOptions): Promise<T>;
}

export type GzFetch = GzFetchClient;
