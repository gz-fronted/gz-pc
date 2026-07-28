import axios, { AxiosError } from 'axios';

export type GzFetchErrorType =
  | 'HTTP_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'CANCELED_ERROR'
  | 'UNKNOWN_ERROR';

export interface GzFetchErrorOptions {
  type: GzFetchErrorType;
  status?: number;
  responseData?: unknown;
  originalError?: unknown;
}

export class GzFetchError extends Error {
  readonly type: GzFetchErrorType;
  readonly status: number | undefined;
  readonly responseData?: unknown;
  readonly originalError?: unknown;

  constructor(message: string, options: GzFetchErrorOptions) {
    super(message);
    this.name = 'GzFetchError';
    this.type = options.type;
    this.status = options.status;
    this.responseData = options.responseData;
    this.originalError = options.originalError;
  }
}

export function getResponseMessage(data: unknown): string | undefined {
  if (typeof data !== 'object' || data === null || !('msg' in data)) {
    return undefined;
  }

  const { msg } = data;
  return typeof msg === 'string' && msg.length > 0 ? msg : undefined;
}

const DEFAULT_HTTP_ERROR_MESSAGE = '请求失败，请稍后重试';
const DEFAULT_NETWORK_ERROR_MESSAGE = '网络异常，请检查网络连接';
const DEFAULT_TIMEOUT_ERROR_MESSAGE = '请求超时，请稍后重试';
const DEFAULT_CANCELED_ERROR_MESSAGE = '请求已取消';
const DEFAULT_UNKNOWN_ERROR_MESSAGE = '请求失败，请稍后重试';

export function toGzFetchError(error: unknown): GzFetchError {
  if (error instanceof GzFetchError) {
    return error;
  }

  if (axios.isCancel(error)) {
    return new GzFetchError(DEFAULT_CANCELED_ERROR_MESSAGE, {
      type: 'CANCELED_ERROR',
      originalError: error,
    });
  }

  if (axios.isAxiosError(error)) {
    if (
      error.code === AxiosError.ECONNABORTED ||
      error.code === AxiosError.ETIMEDOUT
    ) {
      return new GzFetchError(DEFAULT_TIMEOUT_ERROR_MESSAGE, {
        type: 'TIMEOUT_ERROR',
        originalError: error,
      });
    }

    if (error.response) {
      return new GzFetchError(
        getResponseMessage(error.response.data) ?? DEFAULT_HTTP_ERROR_MESSAGE,
        {
          type: 'HTTP_ERROR',
          status: error.response.status,
          responseData: error.response.data,
          originalError: error,
        },
      );
    }

    return new GzFetchError(DEFAULT_NETWORK_ERROR_MESSAGE, {
      type: 'NETWORK_ERROR',
      originalError: error,
    });
  }

  return new GzFetchError(DEFAULT_UNKNOWN_ERROR_MESSAGE, {
    type: 'UNKNOWN_ERROR',
    originalError: error,
  });
}
