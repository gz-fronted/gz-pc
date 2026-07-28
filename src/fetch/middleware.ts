import type {
  GzErrorContext,
  GzFetchMiddleware,
  GzInternalRequestConfig,
  GzResponseContext,
} from './types';
import type { GzFetchError } from './error';

export async function runRequestMiddlewares(
  initialConfig: GzInternalRequestConfig,
  middlewares: readonly GzFetchMiddleware[],
): Promise<GzInternalRequestConfig> {
  let config = initialConfig;

  for (const middleware of middlewares) {
    if (middleware.onRequest) {
      config = await middleware.onRequest(config);
    }
  }

  return config;
}

export async function runResponseMiddlewares<T>(
  initialData: T,
  context: GzResponseContext,
  middlewares: readonly GzFetchMiddleware[],
): Promise<T> {
  let data = initialData;

  for (const middleware of middlewares) {
    if (middleware.onResponse) {
      data = await middleware.onResponse(data, context);
    }
  }

  return data;
}

export async function runErrorMiddlewares(
  error: GzFetchError,
  context: GzErrorContext,
  middlewares: readonly GzFetchMiddleware[],
): Promise<void> {
  for (const middleware of middlewares) {
    await middleware.onError?.(error, context);
  }
}
