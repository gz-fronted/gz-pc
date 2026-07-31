# @gz-fronted/gz-pc

面向 GZ 前端项目的请求、Hooks 和轻量工具函数包。各子路径独立构建；只使用
`utils` 时不会加载 Axios、React、ahooks 或 gg-ui。

## 安装

```bash
npm install @gz-fronted/gz-pc react @chenhui996/gg-ui
```

宿主项目需要提供以下 peer dependencies：

- React 18 或 19
- `@chenhui996/gg-ui` 0.1

Axios 和 ahooks 是 gz-pc 的普通 dependencies，安装 gz-pc 时会自动安装，宿主
无需手工添加。React 和 gg-ui 不会打入本包产物。

本包刻意不提供聚合根入口，请始终从 `/fetch`、`/hooks` 或 `/utils` 子路径导入，
避免加载无关模块。

## 请求协议

gz-fetch **只有在 HTTP Status 为 200 时才认为请求成功**。201、204 以及其他
所有状态都会进入统一错误处理。

成功时直接返回后端原始的 `response.data`，不会返回 `AxiosResponse`，也不会：

- 判断业务 `code`
- 自动解包 `data`
- 转换分页、字段、日期或任何服务端数据

```ts
import { configureGzFetch, gzFetch } from '@gz-fronted/gz-pc/fetch';

// 应用初始化入口只调用一次；微前端重新挂载时可以覆盖上一次配置。
configureGzFetch({
  baseURL: '/api',
  timeout: 15_000,
  getToken: () => runtimeToken,
  showErrorMessage: true,
});

interface ListResult {
  records: Array<{ id: string }>;
  total: number;
}

const result = await gzFetch<ListResult>({
  url: '/users',
  method: 'GET',
  params: {
    page: 1,
    pageSize: 20,
  },
});
result.records;
result.total;

interface CreateUserParams {
  name: string;
}

await gzFetch<ListResult, CreateUserParams>({
  url: '/users',
  method: 'POST',
  params: {
    name: 'Alice',
  },
});
```

业务模块直接导入并调用 `gzFetch`，不需要自行创建请求实例。gz-pc 统一使用
配置对象式请求调用，业务代码不得混用 `gzFetch(config)` 与
`gzFetch.get/post/put/delete` 两种风格。快捷方法仅作为内部兼容层保留，不作为
业务开发规范。

如果在 `configureGzFetch` 之前调用 `gzFetch`，会明确抛出错误，不会静默使用
空配置，也不会读取 `localStorage`。

### 类型签名

`gzFetch` 的第一个泛型是响应数据类型，第二个泛型是请求参数类型：

```ts
function gzFetch<TResponse, TRequestParams = unknown>(
  config: GzRequestConfig<TRequestParams>,
): Promise<TResponse>;
```

成功时直接返回 `response.data`，因此调用结果类型是 `TResponse`，不是
`AxiosResponse<TResponse>`。

### 单次请求配置

| 字段               | 类型                                   | 必填 | 说明                                       |
| ------------------ | -------------------------------------- | ---- | ------------------------------------------ |
| `url`              | `string`                               | 是   | 请求地址；配置了 `baseURL` 时会与其组合    |
| `method`           | `'GET' \| 'POST' \| 'PUT' \| 'DELETE'` | 是   | 请求方法，统一使用大写                     |
| `params`           | `TRequestParams`                       | 否   | 统一请求入参，由第二个泛型约束             |
| `headers`          | `Record<string, string>`               | 否   | 本次请求附加的请求头                       |
| `timeout`          | `number`                               | 否   | 本次请求超时时间，单位毫秒；优先于实例配置 |
| `showErrorMessage` | `boolean`                              | 否   | 是否调用 gg-ui 的 `message.error`          |
| `skipAuth`         | `boolean`                              | 否   | 为 `true` 时跳过 Token 注入                |
| `responseType`     | `'json' \| 'blob' \| 'text'`           | 否   | 响应数据类型，默认 `json`                  |
| `signal`           | `AbortSignal`                          | 否   | 取消请求的标准 AbortSignal                 |

请求入参字段统一使用 `params`，业务代码不需要区分 Axios 的 `params` 和 `data`：

- GET、DELETE：`params` 转为 URL Query。
- POST、PUT：`params` 转为 Request Body。

业务请求配置不支持 `data`，也不得混用 `params` 和 `data`。

完整示例：

```ts
interface SaveParams {
  id: string;
  name: string;
}

interface SaveResult {
  success: boolean;
}

const controller = new AbortController();

const result = await gzFetch<SaveResult, SaveParams>({
  url: '/user/save',
  method: 'POST',
  params: {
    id: '1001',
    name: '张三',
  },
  headers: {
    'X-Request-Source': 'gz-pc',
  },
  timeout: 10_000,
  showErrorMessage: true,
  skipAuth: false,
  responseType: 'json',
  signal: controller.signal,
});
```

### 应用初始化配置

`configureGzFetch` 只在应用初始化层调用。它接收以下配置：

| 字段               | 类型                                                        | 默认值            | 说明                       |
| ------------------ | ----------------------------------------------------------- | ----------------- | -------------------------- |
| `baseURL`          | `string`                                                    | 无                | 所有业务请求的基础地址     |
| `timeout`          | `number`                                                    | `15000`           | 默认请求超时时间，单位毫秒 |
| `getToken`         | `() => string \| undefined \| Promise<string \| undefined>` | 无                | 每次请求前动态获取 Token   |
| `showErrorMessage` | `boolean`                                                   | `true`            | 实例级错误提示开关         |
| `auth.headerName`  | `string`                                                    | `Authorization`   | Token 请求头名称           |
| `auth.formatToken` | `(token: string) => string`                                 | `Bearer ${token}` | Token 格式化函数           |
| `middlewares`      | `readonly GzFetchMiddleware[]`                              | `[]`              | 请求、响应和错误中间件     |

当前稳定 API 没有开放 Axios 的 `withCredentials`、`paramsSerializer`、
`onUploadProgress`、`validateStatus` 等配置，也暂不支持 `PATCH`。业务代码只应传入
上表列出的字段；如果后续确有通用场景，再通过 gz-pc 统一扩展类型和请求核心。

## Token

`getToken` 会在每次请求前动态执行。gz-fetch 不读取 Props、React Context 或
`localStorage`。

默认请求头为 `Authorization: Bearer <token>`：

```ts
configureGzFetch({
  getToken: async () => tokenStore.get(),
});

await gzFetch<PublicConfig>({
  url: '/public/config',
  method: 'GET',
  skipAuth: true,
});
```

也可以修改 Header 名称和格式：

```ts
configureGzFetch({
  getToken: () => token,
  auth: {
    headerName: 'X-Token',
    formatToken: (value) => `Token ${value}`,
  },
});
```

## 错误提示

HTTP 非 200 时仅尝试读取响应体的 `msg`。没有有效 `msg` 时使用默认文案，最终
抛出 `GzFetchError`。

错误类型包括：

- `HTTP_ERROR`
- `NETWORK_ERROR`
- `TIMEOUT_ERROR`
- `CANCELED_ERROR`
- `UNKNOWN_ERROR`

错误 Message 默认开启，优先级为“单请求配置 > 实例配置 > 默认值 true”：

```ts
configureGzFetch({ showErrorMessage: true });

await gzFetch<void, SaveParams>({
  url: '/save',
  method: 'POST',
  params,
  showErrorMessage: false,
});
```

取消请求会转换成 `CANCELED_ERROR`，且默认不调用 `message.error`：

```ts
const controller = new AbortController();

const promise = gzFetch<UserDetail>({
  url: '/users',
  method: 'GET',
  signal: controller.signal,
});

controller.abort();
await promise;
```

## 中间件

中间件的 `onRequest`、`onResponse` 和 `onError` 都按注册顺序执行，不采用洋葱
模型：

```ts
configureGzFetch({
  middlewares: [
    {
      onRequest(config) {
        return {
          ...config,
          headers: {
            ...config.headers,
            'X-Trace-ID': crypto.randomUUID(),
          },
        };
      },
      onResponse(data, context) {
        console.debug(context.status);
        return data;
      },
      onError(error) {
        console.error(error.type);
      },
    },
  ],
});
```

## 独立请求实例

普通业务模块禁止反复调用 `createGzFetch`。它只用于确实需要独立请求实例的高级
场景，例如多后端服务、独立 `baseURL`、独立 Token 或独立中间件链：

```ts
import { createGzFetch } from '@gz-fronted/gz-pc/fetch';

const reportingFetch = createGzFetch({
  baseURL: '/reporting-api',
  getToken: () => reportingToken,
});

const report = await reportingFetch<ReportResult>({
  url: '/reports/latest',
  method: 'GET',
});
```

默认 `gzFetch` 和独立实例都复用同一套请求核心、错误处理、Token 注入和中间件
实现。

## Blob

gz-fetch 只返回 Blob，不创建下载链接、不解析文件名：

```ts
const file = await gzFetch<Blob, ExportParams>({
  url: '/export',
  method: 'POST',
  params,
  responseType: 'blob',
});
```

## Hooks

```ts
import {
  useDebounce,
  useDebounceFn,
  usePagination,
  useRequest,
} from '@gz-fronted/gz-pc/hooks';
```

`gz-pc/hooks` 通过 `export * from 'ahooks'` 完整透传 ahooks 的公开 API，作为团队
统一的 Hooks 使用入口。后续自定义 Hook 也从同一入口导出：

```ts
export * from 'ahooks';
export * from './use-table-height';
```

新增自定义 Hook 时不得与 ahooks 已有导出重名。

## formatDate

```ts
import { formatDate } from '@gz-fronted/gz-pc/utils';

formatDate(new Date()); // YYYY-MM-DD HH:mm:ss
formatDate(Date.now(), 'YYYY-MM-DD');
```

支持 `string | number | Date | null | undefined`。`null`、`undefined`、空字符串和
无效日期统一返回 `--`。该入口不依赖 React、ahooks、Axios 或 gg-ui。

## Query 参数

```ts
import { objectToQuery, queryToObject } from '@gz-fronted/gz-pc/utils';

queryToObject('https://example.com/list?page=1&tag=a&tag=b');
// { page: '1', tag: ['a', 'b'] }

objectToQuery({
  page: 1,
  keyword: 'audit log',
  tag: ['a', 'b'],
});
// page=1&keyword=audit+log&tag=a&tag=b
```

`queryToObject` 支持完整 URL、带 `?` 的 query 和纯 query 字符串；重复参数返回
字符串数组。`objectToQuery` 返回不带前导 `?` 的字符串，跳过 `undefined`，
将 `null` 转为空值，并将数组序列化为重复参数。

## MSW Mock

完整接入样例位于 [`examples/msw`](./examples/msw)。核心启动顺序如下：

```ts
async function bootstrap(): Promise<void> {
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    const { startMock } = await import('./mock/browser');
    await startMock();
  }

  renderApp();
}

void bootstrap();
```

```ts
worker.start({
  onUnhandledRequest: 'bypass',
});
```

必须等待 `worker.start()` 完成后再渲染应用，避免首次请求漏拦截。具体 Handler
和 Mock 数据由业务项目维护，gz-pc 不提供业务 Mock。

## 本地接入

先在本仓库构建并生成 tarball：

```bash
npm run build
npm pack
```

然后在业务项目安装生成的 `.tgz`：

```bash
npm install ../gz-pc/gz-fronted-gz-pc-0.1.0.tgz
```

也可以在联调期间使用业务项目支持的 workspace 或本地 `file:` 依赖。发布前建议
优先用 tarball 验证，因为它与 npm 实际安装内容最接近。

## 提交规范

项目使用 Husky、lint-staged、Commitlint 和 Conventional Commits。安装依赖时
`prepare` 脚本会初始化 Husky。

`pre-commit` 在提交前只检查 Git 暂存区中的文件：

- JavaScript、JSX、TypeScript、TSX：依次执行 `eslint --fix` 和
  `prettier --write`
- JSON、Markdown、YAML、CSS、Less：执行 `prettier --write`

可以自动修复的问题会写回暂存文件；仍存在的 ESLint 错误会阻止提交。lint-staged
只负责提交前的快速增量检查，不替代完整的 `lint`、`typecheck`、`test` 和
`build`。

Prettier 对 JavaScript、TypeScript 和 JSX 统一使用单引号；JSON 按标准继续使用
双引号。

`commit-msg` 使用 Commitlint 校验提交信息：

```text
feat: add request client
fix: handle canceled request
```

缺少合法 type、subject 或其他不符合 Conventional Commits 的提交信息会被拒绝。

## 第一版边界

第一版不包含 Token 自动刷新、自动重试、缓存、请求去重、并发控制、业务 code
判断、`data` 解包、分页/日期转换、错误上报、自动文件下载、内置业务 Mock、
React Context、Zustand 或复杂洋葱中间件。
