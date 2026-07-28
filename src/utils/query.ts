export type QueryPrimitive = string | number | boolean | null | undefined;
export type QueryValue = QueryPrimitive | readonly QueryPrimitive[];
export type QueryInput = Readonly<Record<string, QueryValue>>;
export type QueryObject = Record<string, string | string[]>;

function isQueryPrimitiveArray(
  value: QueryValue,
): value is readonly QueryPrimitive[] {
  return Array.isArray(value);
}

function extractQuery(value: string): string {
  const questionMarkIndex = value.indexOf("?");
  if (questionMarkIndex >= 0) {
    return value.slice(questionMarkIndex + 1).split("#", 1)[0] ?? "";
  }

  if (/^[a-z][a-z\d+.-]*:\/\//i.test(value) || value.startsWith("/")) {
    return "";
  }

  return value.replace(/^\?/, "").split("#", 1)[0] ?? "";
}

export function queryToObject(value: string): QueryObject {
  const entries = new Map<string, string | string[]>();
  const searchParams = new URLSearchParams(extractQuery(value));

  for (const [key, item] of searchParams) {
    const existingValue = entries.get(key);
    if (existingValue === undefined) {
      entries.set(key, item);
    } else if (Array.isArray(existingValue)) {
      existingValue.push(item);
    } else {
      entries.set(key, [existingValue, item]);
    }
  }

  return Object.fromEntries(entries);
}

export function objectToQuery(value: QueryInput): string {
  const searchParams = new URLSearchParams();

  const appendValue = (key: string, item: QueryPrimitive): void => {
    if (item !== undefined) {
      searchParams.append(key, item === null ? "" : String(item));
    }
  };

  for (const [key, item] of Object.entries(value)) {
    if (isQueryPrimitiveArray(item)) {
      for (const arrayItem of item) {
        appendValue(key, arrayItem);
      }
    } else {
      appendValue(key, item);
    }
  }

  return searchParams.toString();
}
