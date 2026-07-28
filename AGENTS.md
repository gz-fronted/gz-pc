# Agent rules

- 所有业务请求统一使用 gzFetch 配置对象式调用，不得混用快捷方法。
- 请求地址字段必须命名为 `url`，不得使用 `api`。
- 详细请求规范见 `docs/agent-references/api.md`。
