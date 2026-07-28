# API 开发规范

## gz-fetch 调用规范

所有业务接口统一使用配置对象式调用：

```ts
gzFetch<ResponseData>({
  url: '/api/path',
  method: 'POST',
  data: params,
});
```

请求地址字段必须使用 `url`，不得使用 `api`。

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
