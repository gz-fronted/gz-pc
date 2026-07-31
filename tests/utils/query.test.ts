import { describe, expect, it } from 'vitest';

import { objectToQuery, queryToObject } from '@gz-fronted/gz-pc/utils';

describe('queryToObject', () => {
  it('parses a complete URL and ignores its hash', () => {
    expect(
      queryToObject(
        'https://example.com/audit/list?page=2&keyword=a%20b#result',
      ),
    ).toEqual({
      page: '2',
      keyword: 'a b',
    });
  });

  it('parses query strings with or without a leading question mark', () => {
    expect(queryToObject('?enabled=true&empty=')).toEqual({
      enabled: 'true',
      empty: '',
    });
    expect(queryToObject('page=1')).toEqual({ page: '1' });
  });

  it('preserves repeated parameters as arrays', () => {
    expect(queryToObject('tag=frontend&tag=tooling')).toEqual({
      tag: ['frontend', 'tooling'],
    });
  });

  it('returns an empty object for URLs without query parameters', () => {
    expect(queryToObject('https://example.com/audit/list')).toEqual({});
    expect(queryToObject('/audit/list')).toEqual({});
    expect(queryToObject('')).toEqual({});
  });
});

describe('objectToQuery', () => {
  it('serializes primitive values without a leading question mark', () => {
    expect(
      objectToQuery({
        page: 2,
        enabled: true,
        keyword: 'a b',
      }),
    ).toBe('page=2&enabled=true&keyword=a+b');
  });

  it('skips undefined and serializes null as an empty value', () => {
    expect(
      objectToQuery({
        omitted: undefined,
        empty: null,
        text: '',
      }),
    ).toBe('empty=&text=');
  });

  it('serializes arrays as repeated parameters', () => {
    expect(
      objectToQuery({
        tag: ['frontend', 'tooling'],
        id: [1, 2],
      }),
    ).toBe('tag=frontend&tag=tooling&id=1&id=2');
  });

  it('round-trips supported query values', () => {
    const query = objectToQuery({
      search: 'request utils',
      page: 1,
      tag: ['typescript', 'npm'],
    });

    expect(queryToObject(query)).toEqual({
      search: 'request utils',
      page: '1',
      tag: ['typescript', 'npm'],
    });
  });
});
