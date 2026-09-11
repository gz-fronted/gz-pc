# Agent rules

- 所有业务请求统一使用 gzFetch 配置对象式调用，不得混用快捷方法。
- 业务请求默认使用 `gzFetch`；`configureGzFetch` 只在应用初始化层调用。
- 普通业务模块不得自行调用 `createGzFetch`；它仅用于多服务等需要独立实例的特殊场景。
- 请求地址字段必须命名为 `url`，不得使用 `api`。
- 请求入参字段统一使用 `params`：GET 转 URL Query，POST/PUT/DELETE 转 Request Body；业务代码不得使用 `data`。
- DELETE 仅在兼容明确要求 Query 参数的接口时设置 `paramsInUrl: true`；其他 Method 不得使用该配置。
- 详细请求规范见 `docs/agent-references/api.md`。
