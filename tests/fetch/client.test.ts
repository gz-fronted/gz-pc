import axios, {
  AxiosError,
  AxiosHeaders,
  CanceledError,
  type AxiosRequestConfig,
  type CreateAxiosDefaults,
} from 'axios';
import type * as AxiosModule from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  configureGzFetch,
  createGzFetch,
  gzFetch,
  GzFetchError,
  type GzFetchMiddleware,
  type GzRequestHeaders,
} from '@lishenchan/gz-pc/fetch';

const mocks = vi.hoisted(() => ({
  request: vi.fn<(config: AxiosRequestConfig) => Promise<MockResponse>>(),
  create: vi.fn<(config?: CreateAxiosDefaults) => MockAxiosInstance>(),
  messageError: vi.fn(),
}));

interface MockResponse {
  data: unknown;
  status: number;
  headers: Record<string, string>;
}

interface MockAxiosInstance {
  request: typeof mocks.request;
}

vi.mock('@chenhui996/gg-ui', () => ({
  message: {
    error: mocks.messageError,
  },
}));

vi.mock('axios', async () => {
  const actual = await vi.importActual<typeof AxiosModule>('axios');

  return {
    ...actual,
    default: {
      ...actual.default,
      create: mocks.create,
    },
  };
});

function requestHeadersAt(index: number): AxiosHeaders {
  const headers = mocks.request.mock.calls[index]?.[0].headers;
  return AxiosHeaders.from(headers as GzRequestHeaders | undefined);
}

function responseError(status: number, data: unknown): AxiosError {
  return new AxiosError(
    `HTTP ${status}`,
    AxiosError.ERR_BAD_RESPONSE,
    undefined,
    undefined,
    {
      data,
      status,
      statusText: String(status),
      headers: {},
      config: { headers: new AxiosHeaders() },
    },
  );
}

beforeEach(() => {
  mocks.request.mockReset();
  mocks.create.mockReset();
  mocks.messageError.mockReset();
  mocks.create.mockReturnValue({ request: mocks.request });
});

describe('createGzFetch', () => {
  it('rejects clearly when the default gzFetch is not configured', async () => {
    await expect(
      gzFetch({ url: '/before-configure', method: 'GET' }),
    ).rejects.toThrow(
      'gzFetch 尚未配置，请先在应用初始化时调用 configureGzFetch。',
    );
    expect(mocks.request).not.toHaveBeenCalled();
  });

  it('uses the default client after configureGzFetch', async () => {
    mocks.request.mockResolvedValue({
      data: { ready: true },
      status: 200,
      headers: {},
    });
    configureGzFetch({ baseURL: '/api' });

    const result = await gzFetch<{ ready: boolean }>({
      url: '/status',
      method: 'GET',
    });

    expect(result).toEqual({ ready: true });
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: '/api' }),
    );
  });

  it('replaces the default client when configured again', async () => {
    const oldGetToken = vi.fn(() => 'old-token');
    const latestGetToken = vi.fn(() => 'latest-token');
    mocks.request.mockResolvedValue({ data: 'ok', status: 200, headers: {} });

    configureGzFetch({ baseURL: '/old', getToken: oldGetToken });
    configureGzFetch({ baseURL: '/latest', getToken: latestGetToken });
    await gzFetch({ url: '/resource', method: 'GET' });

    expect(mocks.create.mock.calls.map(([config]) => config?.baseURL)).toEqual([
      '/old',
      '/latest',
    ]);
    expect(oldGetToken).not.toHaveBeenCalled();
    expect(latestGetToken).toHaveBeenCalledOnce();
    expect(requestHeadersAt(0).get('Authorization')).toBe(
      'Bearer latest-token',
    );
  });

  it('dynamically reads the default client token before every request', async () => {
    const getToken = vi
      .fn<() => string>()
      .mockReturnValueOnce('token-1')
      .mockReturnValueOnce('token-2');
    mocks.request.mockResolvedValue({ data: 'ok', status: 200, headers: {} });
    configureGzFetch({ getToken });

    await gzFetch({ url: '/first', method: 'GET' });
    await gzFetch({ url: '/second', method: 'GET' });

    expect(getToken).toHaveBeenCalledTimes(2);
    expect(requestHeadersAt(0).get('Authorization')).toBe('Bearer token-1');
    expect(requestHeadersAt(1).get('Authorization')).toBe('Bearer token-2');
  });

  it('shares the same middleware and request core with createGzFetch', async () => {
    const urls: string[] = [];
    const middleware: GzFetchMiddleware = {
      onRequest(config) {
        urls.push(config.url);
        return config;
      },
    };
    mocks.request.mockResolvedValue({ data: 'ok', status: 200, headers: {} });

    configureGzFetch({ middlewares: [middleware] });
    const independentClient = createGzFetch({ middlewares: [middleware] });
    await gzFetch({ url: '/default', method: 'GET' });
    await independentClient({ url: '/independent', method: 'GET' });

    expect(urls).toEqual(['/default', '/independent']);
    expect(mocks.request).toHaveBeenCalledTimes(2);
  });

  it('configures Axios so only HTTP 200 is successful', () => {
    createGzFetch();

    const validateStatus = mocks.create.mock.calls[0]?.[0]?.validateStatus;
    expect(validateStatus?.(200)).toBe(true);
    expect(validateStatus?.(201)).toBe(false);
    expect(validateStatus?.(204)).toBe(false);
  });

  it('returns response.data unchanged for HTTP 200', async () => {
    const body = { records: [], total: 0, data: { untouched: true } };
    mocks.request.mockResolvedValue({ data: body, status: 200, headers: {} });

    const result = await createGzFetch()<typeof body>({
      url: '/list',
      method: 'GET',
    });

    expect(result).toBe(body);
  });

  it('maps params to query for GET and to body for POST', async () => {
    interface CreateUserParams {
      name: string;
    }

    mocks.request.mockResolvedValue({ data: 'ok', status: 200, headers: {} });
    const gzFetch = createGzFetch();
    const getParams = { userId: 'user-1' };
    const postParams: CreateUserParams = { name: 'Alice' };

    await gzFetch<string>({
      url: '/user/detail',
      method: 'GET',
      params: getParams,
    });
    await gzFetch<string, CreateUserParams>({
      url: '/user/create',
      method: 'POST',
      params: postParams,
    });

    expect(mocks.request.mock.calls[0]?.[0]).toMatchObject({
      url: '/user/detail',
      method: 'GET',
      params: getParams,
    });
    expect(mocks.request.mock.calls[0]?.[0].data).toBeUndefined();
    expect(mocks.request.mock.calls[1]?.[0]).toMatchObject({
      url: '/user/create',
      method: 'POST',
      data: postParams,
    });
    expect(mocks.request.mock.calls[1]?.[0].params).toBeUndefined();
  });

  it('maps params to query for DELETE and to body for PUT', async () => {
    const deleteParams = { id: 'user-1' };
    const putParams = { name: 'Alice' };
    mocks.request.mockResolvedValue({ data: 'ok', status: 200, headers: {} });
    const client = createGzFetch();

    await client({
      url: '/user',
      method: 'DELETE',
      params: deleteParams,
    });
    await client({
      url: '/user',
      method: 'PUT',
      params: putParams,
    });

    expect(mocks.request.mock.calls[0]?.[0]).toMatchObject({
      method: 'DELETE',
      params: deleteParams,
    });
    expect(mocks.request.mock.calls[0]?.[0].data).toBeUndefined();
    expect(mocks.request.mock.calls[1]?.[0]).toMatchObject({
      method: 'PUT',
      data: putParams,
    });
    expect(mocks.request.mock.calls[1]?.[0].params).toBeUndefined();
  });

  it.each([201, 204])('classifies HTTP %s as an HTTP error', async (status) => {
    mocks.request.mockRejectedValue(responseError(status, undefined));

    await expect(
      createGzFetch()({ url: '/resource', method: 'GET' }),
    ).rejects.toMatchObject({
      type: 'HTTP_ERROR',
      status,
    });
  });

  it('uses only a non-empty msg from an HTTP error body', async () => {
    const responseData = {
      msg: '保存失败',
      message: 'must not win',
      data: { detail: true },
    };
    mocks.request.mockRejectedValue(responseError(400, responseData));

    await expect(
      createGzFetch()({ url: '/save', method: 'POST' }),
    ).rejects.toMatchObject({
      type: 'HTTP_ERROR',
      message: '保存失败',
      responseData,
    });
    expect(mocks.messageError).toHaveBeenCalledOnce();
    expect(mocks.messageError).toHaveBeenCalledWith('保存失败');
  });

  it('uses the default HTTP message when msg is absent', async () => {
    mocks.request.mockRejectedValue(responseError(400, { message: 'ignored' }));

    await expect(
      createGzFetch()({ url: '/bad', method: 'GET' }),
    ).rejects.toMatchObject({
      message: '请求失败，请稍后重试',
    });
  });

  it('shows errors by default and supports instance opt-out', async () => {
    mocks.request.mockRejectedValueOnce(responseError(500, undefined));
    await expect(
      createGzFetch()({ url: '/default', method: 'GET' }),
    ).rejects.toBeInstanceOf(GzFetchError);
    expect(mocks.messageError).toHaveBeenCalledOnce();

    mocks.request.mockRejectedValueOnce(responseError(500, undefined));
    await expect(
      createGzFetch({ showErrorMessage: false })({
        url: '/silent',
        method: 'GET',
      }),
    ).rejects.toBeInstanceOf(GzFetchError);
    expect(mocks.messageError).toHaveBeenCalledOnce();
  });

  it('lets request config override instance message config', async () => {
    const client = createGzFetch({ showErrorMessage: false });
    mocks.request.mockRejectedValue(responseError(500, undefined));

    await expect(
      client({
        url: '/loud',
        method: 'GET',
        showErrorMessage: true,
      }),
    ).rejects.toBeInstanceOf(GzFetchError);
    expect(mocks.messageError).toHaveBeenCalledOnce();

    mocks.messageError.mockClear();
    await expect(
      createGzFetch({ showErrorMessage: true })({
        url: '/silent',
        method: 'GET',
        showErrorMessage: false,
      }),
    ).rejects.toBeInstanceOf(GzFetchError);
    expect(mocks.messageError).not.toHaveBeenCalled();
  });

  it('dynamically injects and formats a token before every request', async () => {
    const getToken = vi
      .fn<() => string>()
      .mockReturnValueOnce('token-1')
      .mockReturnValueOnce('token-2');
    mocks.request.mockResolvedValue({ data: null, status: 200, headers: {} });
    const client = createGzFetch({ getToken });

    await client({ url: '/first', method: 'GET' });
    await client({ url: '/second', method: 'GET' });

    expect(getToken).toHaveBeenCalledTimes(2);
    const firstHeaders = requestHeadersAt(0);
    const secondHeaders = requestHeadersAt(1);
    expect(firstHeaders.get('Authorization')).toBe('Bearer token-1');
    expect(secondHeaders.get('Authorization')).toBe('Bearer token-2');
  });

  it('supports custom auth formatting and skipAuth', async () => {
    const getToken = vi.fn(() => 'secret');
    mocks.request.mockResolvedValue({ data: null, status: 200, headers: {} });
    const client = createGzFetch({
      getToken,
      auth: {
        headerName: 'X-Token',
        formatToken: (token) => `Token ${token}`,
      },
    });

    await client({ url: '/private', method: 'GET' });
    await client({ url: '/public', method: 'GET', skipAuth: true });

    expect(requestHeadersAt(0).get('X-Token')).toBe('Token secret');
    expect(requestHeadersAt(1).has('X-Token')).toBe(false);
    expect(getToken).toHaveBeenCalledOnce();
  });

  it.each([
    [
      'network',
      new AxiosError('network', AxiosError.ERR_NETWORK),
      'NETWORK_ERROR',
      '网络异常，请检查网络连接',
    ],
    [
      'timeout',
      new AxiosError('timeout', AxiosError.ECONNABORTED),
      'TIMEOUT_ERROR',
      '请求超时，请稍后重试',
    ],
    [
      'unknown',
      new Error('unexpected'),
      'UNKNOWN_ERROR',
      '请求失败，请稍后重试',
    ],
  ])('classifies %s errors', async (_name, error, type, errorMessage) => {
    mocks.request.mockRejectedValue(error);

    await expect(
      createGzFetch()({ url: '/error', method: 'GET' }),
    ).rejects.toMatchObject({
      type,
      message: errorMessage,
      originalError: error,
    });
  });

  it('classifies cancellation without displaying a message', async () => {
    const controller = new AbortController();
    controller.abort();
    mocks.request.mockRejectedValue(new CanceledError('aborted'));

    await expect(
      createGzFetch()({
        url: '/cancel',
        method: 'GET',
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({
      type: 'CANCELED_ERROR',
    });
    expect(mocks.request).toHaveBeenCalledWith(
      expect.objectContaining({ signal: controller.signal }),
    );
    expect(controller.signal.aborted).toBe(true);
    expect(mocks.messageError).not.toHaveBeenCalled();
  });

  it('forwards standard AbortSignal and responseType', async () => {
    const controller = new AbortController();
    const blob = new Blob(['content']);
    mocks.request.mockResolvedValue({ data: blob, status: 200, headers: {} });

    const result = await createGzFetch()<Blob>({
      url: '/export',
      method: 'POST',
      params: { scope: 'all' },
      responseType: 'blob',
      signal: controller.signal,
    });

    expect(result).toBe(blob);
    expect(mocks.request).toHaveBeenCalledWith(
      expect.objectContaining({
        responseType: 'blob',
        signal: controller.signal,
      }),
    );
  });

  it('runs request and response middleware in registration order', async () => {
    const calls: string[] = [];
    const createMiddleware = (name: string): GzFetchMiddleware => ({
      onRequest(config) {
        calls.push(`request:${name}`);
        return config;
      },
      onResponse<T>(data: T) {
        calls.push(`response:${name}`);
        return data;
      },
    });
    mocks.request.mockResolvedValue({ data: 'ok', status: 200, headers: {} });

    await createGzFetch({
      middlewares: [createMiddleware('one'), createMiddleware('two')],
    })({ url: '/ordered', method: 'GET' });

    expect(calls).toEqual([
      'request:one',
      'request:two',
      'response:one',
      'response:two',
    ]);
  });

  it('runs error middleware in registration order', async () => {
    const calls: string[] = [];
    const createMiddleware = (name: string): GzFetchMiddleware => ({
      onError() {
        calls.push(name);
      },
    });
    mocks.request.mockRejectedValue(responseError(500, undefined));

    await expect(
      createGzFetch({
        middlewares: [createMiddleware('one'), createMiddleware('two')],
      })({ url: '/ordered', method: 'GET' }),
    ).rejects.toBeInstanceOf(GzFetchError);

    expect(calls).toEqual(['one', 'two']);
  });

  it('routes compatibility methods through the same middleware and request core', async () => {
    const methods: string[] = [];
    mocks.request.mockResolvedValue({ data: 'ok', status: 200, headers: {} });
    const client = createGzFetch({
      middlewares: [
        {
          onRequest(config) {
            methods.push(config.method);
            return config;
          },
        },
      ],
    });

    await client({ url: '/resource', method: 'GET' });
    await client.get('/resource');
    await client.post('/resource', { name: 'new' });
    await client.put('/resource', { name: 'updated' });
    await client.delete('/resource');

    expect(mocks.request.mock.calls.map(([config]) => config.method)).toEqual([
      'GET',
      'GET',
      'POST',
      'PUT',
      'DELETE',
    ]);
    expect(methods).toEqual(['GET', 'GET', 'POST', 'PUT', 'DELETE']);
  });

  it('uses the real Axios error guards', () => {
    expect(axios.isAxiosError(new AxiosError())).toBe(true);
  });
});
