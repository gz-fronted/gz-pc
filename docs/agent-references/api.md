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
  url: "/api/path",
  method: "POST",
  data: params,
});
```

请求地址字段必须使用 `url`，不得使用 `api`。

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
