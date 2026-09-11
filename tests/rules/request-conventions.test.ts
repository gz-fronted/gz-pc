import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

import type { GzRequestConfig } from '@gz-fronted/gz-pc/fetch';

describe('gz-fetch request conventions', () => {
  it('keeps response and request params types independent', () => {
    interface SaveParams {
      name: string;
    }

    const config: GzRequestConfig<SaveParams> = {
      url: '/user/save',
      method: 'POST',
      params: { name: 'Alice' },
      headers: { 'X-Trace-ID': 'trace-1' },
      responseType: 'json',
    };

    expect(config.url).toBe('/user/save');
    expect(config.params?.name).toBe('Alice');
  });

  it('documents object-style calls as a hard rule', async () => {
    const [agents, apiRules, readme] = await Promise.all([
      readFile(new URL('../../AGENTS.md', import.meta.url), 'utf8'),
      readFile(
        new URL('../../docs/agent-references/api.md', import.meta.url),
        'utf8',
      ),
      readFile(new URL('../../README.md', import.meta.url), 'utf8'),
    ]);

    expect(agents).toContain('所有业务请求统一使用 gzFetch 配置对象式调用');
    expect(agents).toContain('`configureGzFetch` 只在应用初始化层调用');
    expect(agents).toContain('普通业务模块不得自行调用 `createGzFetch`');
    expect(apiRules).toContain('禁止在业务代码中混用');
    expect(apiRules).toContain('请求地址字段必须使用 `url`');
    expect(apiRules).toContain('请求入参字段统一使用 `params`');
    expect(apiRules).toContain('GET 转为 URL Query');
    expect(apiRules).toContain('POST、PUT、DELETE 转为 Request Body');
    expect(apiRules).toContain('DELETE 的 `paramsInUrl` 默认为 `false`');
    expect(apiRules).toContain('`paramsInUrl` 仅对 DELETE 生效');
    expect(apiRules).toContain('所有 HTTP `2xx` 状态视为成功');
    expect(apiRules).toContain('原样返回完整的 `response.data`');
    expect(apiRules).toContain('使用 `withCredentials: true`');
    expect(apiRules).toContain('HTTP 401 统一弹窗和登录跳转默认关闭');
    expect(apiRules).toContain('所有 gzFetch 实例共享同一个 401 管理器');
    expect(apiRules).toContain('`GzFetchFeedbackProvider`');
    expect(apiRules).toContain('所有普通业务接口直接使用默认 `gzFetch`');
    expect(apiRules).toContain('`createGzFetch` 仅用于多后端服务');
    expect(readme).toContain('配置对象式请求调用');
    expect(readme).toContain('请求入参字段统一使用 `params`');
    expect(readme).toContain('业务模块直接导入并调用 `gzFetch`');
    expect(readme).toContain('普通业务模块禁止反复调用 `createGzFetch`');
    expect(readme).not.toContain('const gzFetch = createGzFetch');
    expect(readme).not.toMatch(
      /await\s+\w+\.(?:get|post|put|delete)\s*(?:<[^>]+>)?\s*\(/,
    );
  });
});
