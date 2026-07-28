import { describe, expect, it } from 'vitest';

import { getResponseMessage } from '@lishenchan/gz-pc/fetch';

describe('getResponseMessage', () => {
  it('only returns a non-empty string msg', () => {
    expect(getResponseMessage({ msg: 'error' })).toBe('error');
    expect(getResponseMessage({ msg: 1 })).toBeUndefined();
    expect(getResponseMessage({ msg: '' })).toBeUndefined();
    expect(getResponseMessage({ message: 'ignored' })).toBeUndefined();
    expect(getResponseMessage(null)).toBeUndefined();
  });
});
