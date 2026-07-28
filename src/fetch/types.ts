import type { AxiosHeaders } from 'axios';

import type { GzFetchError } from './error';

export type GzRequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
export type GzResponseType = 'json' | 'blob' | 'text';
export type GzRequestParams = Record<string, unknown>;
export type GzRequestHeaders =
  Record<string, string | number | boolean | null> | AxiosHeaders;

export interface GzRequestConfig<TRequestData = unknown> {
  url: string;
  method: GzRequestMethod;
  params?: GzRequestParams;
  data?: TRequestData;
  headers?: Record<string, string>;
  timeout?: number;
  showErrorMessage?: boolean;
  skipAuth?: boolean;
  responseType?: GzResponseType;
  signal?: AbortSignal;
}

export interface GzInternalRequestConfig extends Omit<
  GzRequestConfig<unknown>,
  'headers'
> {
  headers?: GzRequestHeaders;
  data?: unknown;
}

export type GzRequestOptions = Omit<
  GzRequestConfig<never>,
  'url' | 'method' | 'data'
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

export interface CreateGzFetchOptions {
  baseURL?: string;
  timeout?: number;
  getToken?: () => string | undefined | Promise<string | undefined>;
  showErrorMessage?: boolean;
  auth?: GzFetchAuthOptions;
  middlewares?: readonly GzFetchMiddleware[];
}

export interface GzFetchClient {
  <TResponse, TRequestData = unknown>(
    config: GzRequestConfig<TRequestData>,
  ): Promise<TResponse>;
  get<T>(url: string, config?: GzRequestOptions): Promise<T>;
  post<T, TBody = unknown>(
    url: string,
    data?: TBody,
    config?: GzRequestOptions,
  ): Promise<T>;
  put<T, TBody = unknown>(
    url: string,
    data?: TBody,
    config?: GzRequestOptions,
  ): Promise<T>;
  delete<T>(url: string, config?: GzRequestOptions): Promise<T>;
}

export type GzFetch = GzFetchClient;
