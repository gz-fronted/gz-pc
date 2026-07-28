import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

import type { GzRequestConfig } from '@lishenchan/gz-pc/fetch';

describe('gz-fetch request conventions', () => {
  it('keeps response and request body types independent', () => {
    interface SaveParams {
      name: string;
    }

    const config: GzRequestConfig<SaveParams> = {
      url: '/user/save',
      method: 'POST',
      data: { name: 'Alice' },
      params: { source: 'admin' },
      headers: { 'X-Trace-ID': 'trace-1' },
      responseType: 'json',
    };

    expect(config.url).toBe('/user/save');
    expect(config.data?.name).toBe('Alice');
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
    expect(apiRules).toContain('禁止在业务代码中混用');
    expect(apiRules).toContain('请求地址字段必须使用 `url`');
    expect(readme).toContain('gz-pc 统一使用配置对象式请求调用');
    expect(readme).not.toMatch(
      /await\s+\w+\.(?:get|post|put|delete)\s*(?:<[^>]+>)?\s*\(/,
    );
  });
});
