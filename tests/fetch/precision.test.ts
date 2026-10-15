import axios from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  configureGzFetch,
  createGzFetch,
  gzFetch,
} from '@gz-fronted/gz-pc/fetch';
import type { GzFetchError, GzFetchMiddleware } from '@gz-fronted/gz-pc/fetch';

vi.mock('gz-ui-web', () => ({
  message: { error: vi.fn() },
}));

const URL = 'https://gz-fetch.test/precision';
const LONG_ID = '352782533194208303';
const server = setupServer();
const originalAdapter = axios.defaults.adapter;

function respond(body: string, status = 200): void {
  server.use(
    http.get(
      URL,
      () =>
        new HttpResponse(body, {
          status,
          headers: { 'Content-Type': 'application/json' },
        }),
    ),
  );
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
afterEach(() => {
  server.resetHandlers();
  if (originalAdapter === undefined) {
    delete axios.defaults.adapter;
  } else {
    axios.defaults.adapter = originalAdapter;
  }
  vi.unstubAllEnvs();
});

describe.each(['http', 'fetch'])(
  'precision with Axios %s adapter',
  (adapter) => {
    beforeEach(() => {
      axios.defaults.adapter = adapter;
      vi.stubEnv('NO_PROXY', '*');
    });

    it('preserves the reported ID before response middleware runs', async () => {
      respond(`{"targtAllVarCodeSum":${LONG_ID},"count":2}`);
      const observed = vi.fn();
      const middleware: GzFetchMiddleware = {
        onResponse(data) {
          observed(data);
          return data;
        },
      };
      configureGzFetch({
        preserveNumberPrecision: true,
        middlewares: [middleware],
      });

      const result = await gzFetch({ url: URL, method: 'GET' });

      expect(result).toEqual({ targtAllVarCodeSum: LONG_ID, count: 2 });
      expect(observed).toHaveBeenCalledWith(result);
    });

    it.each([undefined, false])(
      'keeps the default behavior when set to %s',
      async (enabled) => {
        const body = `{"id":${LONG_ID}}`;
        respond(body);
        const client = createGzFetch(
          enabled === undefined ? {} : { preserveNumberPrecision: enabled },
        );

        const result = await client<{ id: number }>({
          url: URL,
          method: 'GET',
        });

        expect(result).toEqual(JSON.parse(body));
        expect(typeof result.id).toBe('number');
        expect(String(result.id)).not.toBe(LONG_ID);
      },
    );

    it.each([
      '9007199254740992',
      '-9007199254740992',
      LONG_ID,
      '0.1234567890123456789012345',
      '-123456789012345.6789',
      '3.52782533194208303e17',
      '1e20',
      '1e400',
      '1e-400',
    ])('preserves unsafe numeric literal %s exactly', async (literal) => {
      respond(`{"value":${literal}}`);
      const client = createGzFetch({ preserveNumberPrecision: true });

      await expect(client({ url: URL, method: 'GET' })).resolves.toEqual({
        value: literal,
      });
    });

    it('retains safe numbers, strings, nesting and envelope fields', async () => {
      respond(
        `{"code":0,"data":[${LONG_ID},-${LONG_ID},"${LONG_ID}",{"text":"id: ${LONG_ID}, \\"quoted\\"","values":[0,-0,0.1,1.2300,1e3,1e-7,9007199254740991,-9007199254740991]}],"ok":true,"empty":null}`,
      );
      const client = createGzFetch({ preserveNumberPrecision: true });

      await expect(client({ url: URL, method: 'GET' })).resolves.toEqual({
        code: 0,
        data: [
          LONG_ID,
          `-${LONG_ID}`,
          LONG_ID,
          {
            text: `id: ${LONG_ID}, "quoted"`,
            values: [
              0, -0, 0.1, 1.23, 1000, 1e-7, 9007199254740991, -9007199254740991,
            ],
          },
        ],
        ok: true,
        empty: null,
      });
    });

    it.each([
      ['"123"', '123'],
      [`"${LONG_ID}"`, LONG_ID],
      [LONG_ID, LONG_ID],
      ['null', null],
    ])(
      'does not reparse a primitive JSON response %s',
      async (body, expected) => {
        respond(body);
        const client = createGzFetch({ preserveNumberPrecision: true });
        await expect(client({ url: URL, method: 'GET' })).resolves.toBe(
          expected,
        );
      },
    );

    it.each([400, 401, 500])(
      'preserves HTTP %s responseData before error middleware',
      async (status) => {
        respond(
          `{"msg":"request failed","id":${LONG_ID},"amount":0.1234567890123456789}`,
          status,
        );
        const observed = vi.fn<(error: GzFetchError) => void>();
        const client = createGzFetch({
          preserveNumberPrecision: true,
          showErrorMessage: false,
          middlewares: [{ onError: observed }],
        });

        await expect(client({ url: URL, method: 'GET' })).rejects.toMatchObject(
          {
            type: 'HTTP_ERROR',
            status,
            message: 'request failed',
            responseData: {
              msg: 'request failed',
              id: LONG_ID,
              amount: '0.1234567890123456789',
            },
          },
        );
        expect(observed.mock.calls[0]?.[0]).toMatchObject({
          responseData: { id: LONG_ID },
        });
      },
    );

    it.each([undefined, 'json'] as const)(
      'parses JSON when responseType is %s',
      async (responseType) => {
        respond(`{"id":${LONG_ID}}`, 201);
        const client = createGzFetch({ preserveNumberPrecision: true });
        await expect(
          client({
            url: URL,
            method: 'GET',
            ...(responseType === undefined ? {} : { responseType }),
          }),
        ).resolves.toEqual({ id: LONG_ID });
      },
    );

    it('leaves explicit text unchanged even with a JSON content type', async () => {
      const body = `{"id":${LONG_ID}}`;
      respond(body);
      const client = createGzFetch({ preserveNumberPrecision: true });
      await expect(
        client({ url: URL, method: 'GET', responseType: 'text' }),
      ).resolves.toBe(body);
    });

    it.skipIf(adapter !== 'fetch')(
      'leaves a Blob download unchanged',
      async () => {
        const body = `{"id":${LONG_ID}}`;
        respond(body);
        const client = createGzFetch({ preserveNumberPrecision: true });
        const result = await client<Blob>({
          url: URL,
          method: 'GET',
          responseType: 'blob',
        });
        expect(result).toBeInstanceOf(Blob);
        expect(await result.text()).toBe(body);
      },
    );

    it('leaves explicit text HTTP errors unchanged', async () => {
      const body = `{"id":${LONG_ID}}`;
      respond(body, 400);
      const client = createGzFetch({
        preserveNumberPrecision: true,
        showErrorMessage: false,
      });
      await expect(
        client({ url: URL, method: 'GET', responseType: 'text' }),
      ).rejects.toMatchObject({
        type: 'HTTP_ERROR',
        responseData: body,
      });
    });

    it('keeps empty 204 responses and invalid JSON behavior', async () => {
      server.use(http.get(URL, () => new HttpResponse(null, { status: 204 })));
      const client = createGzFetch({ preserveNumberPrecision: true });
      await expect(client({ url: URL, method: 'GET' })).resolves.toBe('');
      for (const body of [
        'plain text',
        `{"id":${LONG_ID}`,
        `{${LONG_ID}:1}`,
        `{"id":${LONG_ID}} trailing`,
      ]) {
        respond(body);
        await expect(client({ url: URL, method: 'GET' })).resolves.toBe(body);
      }
    });

    it('retains JSON duplicate-key and own-property semantics', async () => {
      respond(
        `{"id":1,"id":${LONG_ID},"__proto__":{"id":${LONG_ID}},"constructor":2}`,
      );
      const client = createGzFetch({ preserveNumberPrecision: true });
      const result = await client<Record<string, unknown>>({
        url: URL,
        method: 'GET',
      });
      expect(result.id).toBe(LONG_ID);
      expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
      expect(Object.prototype.hasOwnProperty.call(result, '__proto__')).toBe(
        true,
      );
      expect(result['__proto__']).toEqual({ id: LONG_ID });
      expect(result.constructor).toBe(2);
    });

    it('isolates the option to its configured instance', async () => {
      respond(`{"id":${LONG_ID}}`);
      const enabled = createGzFetch({ preserveNumberPrecision: true });
      const disabled = createGzFetch();
      await expect(enabled({ url: URL, method: 'GET' })).resolves.toEqual({
        id: LONG_ID,
      });
      await expect(disabled({ url: URL, method: 'GET' })).resolves.toEqual({
        id: Number(LONG_ID),
      });
    });
  },
);
