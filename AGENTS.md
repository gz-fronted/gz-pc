# Agent rules

- 所有业务请求统一使用 gzFetch 配置对象式调用，不得混用快捷方法。
- 业务请求默认使用 `gzFetch`；`configureGzFetch` 只在应用初始化层调用。
- 普通业务模块不得自行调用 `createGzFetch`；它仅用于多服务等需要独立实例的特殊场景。
- 请求地址字段必须命名为 `url`，不得使用 `api`。
- 详细请求规范见 `docs/agent-references/api.md`。
