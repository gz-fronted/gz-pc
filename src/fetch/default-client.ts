import { createGzFetch } from './client';
import type {
  CreateGzFetchOptions,
  GzFetchClient,
  GzRequestConfig,
} from './types';

const NOT_CONFIGURED_MESSAGE =
  'gzFetch 尚未配置，请先在应用初始化时调用 configureGzFetch。';

let defaultClient: GzFetchClient | undefined;

export function configureGzFetch(options: CreateGzFetchOptions): void {
  defaultClient = createGzFetch(options);
}

export async function gzFetch<TResponse, TRequestParams = unknown>(
  config: GzRequestConfig<TRequestParams>,
): Promise<TResponse> {
  if (!defaultClient) {
    throw new Error(NOT_CONFIGURED_MESSAGE);
  }

  return defaultClient<TResponse, TRequestParams>(config);
}
