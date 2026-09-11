# API 开发规范

## gz-fetch 调用规范

应用初始化层统一配置一次默认请求实例：

```ts
configureGzFetch({
  baseURL,
  getToken,
});
```

所有普通业务接口直接使用默认 `gzFetch`，并采用配置对象式调用：

```ts
gzFetch<ResponseData>({
  url: '/api/path',
  method: 'POST',
  params,
});
```

请求地址字段必须使用 `url`，不得使用 `api`。

请求入参字段统一使用 `params`，不得在业务请求配置中使用 `data`。请求核心根据
HTTP Method 进行唯一映射：

- GET 转为 URL Query。
- POST、PUT、DELETE 转为 Request Body。

DELETE 的 `paramsInUrl` 默认为 `false`。仅当兼容明确要求 Query 参数的历史或特殊
接口时设置为 `true`；此时 `params` 只转为 URL Query，不再发送 Request Body：

```ts
gzFetch<void, { id: number }>({
  url: '/users',
  method: 'DELETE',
  params: { id: 1 },
  paramsInUrl: true,
});
```

`paramsInUrl` 仅对 DELETE 生效，并且不会作为请求参数发送给后端。GET、POST、PUT
不得使用该配置。

业务代码不需要理解 Axios 的 `params` 与 `data` 差异，也不得自行维护另一套
映射规则。

默认将所有 HTTP `2xx` 状态视为成功；非 `2xx` 状态统一抛出 `GzFetchError`，并
保留 `status` 和 `responseData`。如需覆盖成功状态范围，只能在应用初始化层通过
`configureGzFetch({ validateStatus })` 配置。

HTTP 401 统一弹窗和登录跳转默认关闭。业务项目需要该能力时，只能在应用初始化层通过
`configureGzFetch({ unauthorized: { enabled: true } })` 显式开启，并在应用根部的
gg-ui `ConfigProvider` 内挂载一次 `GzFetchFeedbackProvider`。该 Provider 同时承载
主题上下文内的普通错误消息和 401 弹窗；业务页面不得自行维护反馈状态。
所有 gzFetch 实例共享同一个 401 管理器，并发 401 只显示一个弹窗。

`unauthorized` 支持 `loginUrl`、`modalTitle`、`modalMessage` 和 `onUnauthorized`。
确认弹窗后优先执行 `onUnauthorized`；未配置时使用
`window.location.assign(loginUrl)`。401 弹窗必须通过受控 gg-ui Modal 消费宿主主题
上下文，不得在请求层静态调用 `Modal.confirm` 或复制亮色、暗色样式。

成功响应必须原样返回完整的 `response.data`，不得判断业务 `code`、自动解包业务
`data`，也不得转换分页、字段、日期或枚举。

单次请求需要携带跨域 Cookie 等凭证时，使用 `withCredentials: true`。POST、PUT、
DELETE 的 `params` 必须支持 JSON、`FormData`、`URLSearchParams` 和 `Blob`，自定义
请求头通过 `headers` 传入。

`configureGzFetch` 只能在应用初始化层调用。普通业务模块不得反复配置默认实例，
也不得自行创建请求实例。

禁止在业务代码中混用：

```ts
gzFetch.get(...);
gzFetch.post(...);
gzFetch.put(...);
gzFetch.delete(...);
```

即使工具库内部保留快捷方法，也仅用于兼容，不作为业务开发规范。后续新增业务
代码必须使用配置对象式调用。

所有请求必须通过统一配置对象进入同一个请求核心流程，不得为配置对象式调用和
快捷方法分别维护请求实现。

`createGzFetch` 仅用于多后端服务、独立 `baseURL`、独立 Token 或独立中间件链等
明确需要隔离实例的特殊场景。
