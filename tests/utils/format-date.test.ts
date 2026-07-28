import { describe, expect, it } from 'vitest';

import { DEFAULT_DATE_FORMAT, formatDate } from '@lishenchan/gz-pc/utils';

describe('formatDate', () => {
  const date = new Date(2026, 6, 28, 9, 8, 7, 6);

  it('uses the default format', () => {
    expect(DEFAULT_DATE_FORMAT).toBe('YYYY-MM-DD HH:mm:ss');
    expect(formatDate(date)).toBe('2026-07-28 09:08:07');
  });

  it('supports a custom format', () => {
    expect(formatDate(date, 'YYYY-MM-DD')).toBe('2026-07-28');
    expect(formatDate(date, 'HH:mm:ss.SSS')).toBe('09:08:07.006');
  });

  it('supports Date, timestamp and string inputs', () => {
    const timestamp = date.getTime();
    const localDateString = '2026/07/28 09:08:07';

    expect(formatDate(new Date(timestamp))).toBe('2026-07-28 09:08:07');
    expect(formatDate(timestamp)).toBe('2026-07-28 09:08:07');
    expect(formatDate(localDateString)).toBe('2026-07-28 09:08:07');
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['empty string', ''],
    ['whitespace string', '   '],
    ['invalid date', 'not-a-date'],
    ['invalid Date object', new Date(Number.NaN)],
  ])('returns -- for %s', (_name, value) => {
    expect(formatDate(value)).toBe('--');
  });
});
