export type DateValue = string | number | Date | null | undefined;

export const DEFAULT_DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss';
const INVALID_DATE_PLACEHOLDER = '--';

function pad(value: number, length = 2): string {
  return String(value).padStart(length, '0');
}

export function formatDate(
  value: DateValue,
  format = DEFAULT_DATE_FORMAT,
): string {
  if (
    value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim() === '')
  ) {
    return INVALID_DATE_PLACEHOLDER;
  }

  const date =
    value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return INVALID_DATE_PLACEHOLDER;
  }

  const tokens: Readonly<Record<string, string>> = {
    YYYY: pad(date.getFullYear(), 4),
    MM: pad(date.getMonth() + 1),
    DD: pad(date.getDate()),
    HH: pad(date.getHours()),
    mm: pad(date.getMinutes()),
    ss: pad(date.getSeconds()),
    SSS: pad(date.getMilliseconds(), 3),
  };

  return format.replace(
    /YYYY|SSS|MM|DD|HH|mm|ss/g,
    (token) => tokens[token] ?? token,
  );
}
