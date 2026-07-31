import { describe, expect, it } from 'vitest';

import {
  useDebounce,
  useDebounceFn,
  usePagination,
  useRequest,
} from '@gz-fronted/gz-pc/hooks';

describe('hooks entry', () => {
  it('passes through public ahooks APIs', () => {
    expect(useRequest).toBeTypeOf('function');
    expect(useDebounce).toBeTypeOf('function');
    expect(useDebounceFn).toBeTypeOf('function');
    expect(usePagination).toBeTypeOf('function');
  });
});
