import axios from 'axios';
import type { AxiosResponseTransformer } from 'axios';
import { isSafeNumber, parse } from 'lossless-json';

const JSON_TOKENS =
  /"(?:\\[\s\S]|[^"\\])*"|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/g;

function parseNumber(value: string): number | string {
  const number = Number(value);
  return isSafeNumber(value) &&
    (!Number.isInteger(number) || Number.isSafeInteger(number))
    ? number
    : value;
}

export const transformResponsePreservingNumbers: AxiosResponseTransformer =
  function (data: unknown, headers, status): unknown {
    if (
      typeof data !== 'string' ||
      data.length === 0 ||
      (this.responseType !== undefined && this.responseType !== 'json')
    ) {
      return data;
    }

    try {
      const preservedNumbers = new Set<string>();
      // Validate the original JSON before rewriting numeric tokens. Use native
      // JSON.parse for object creation, including own properties like __proto__.
      parse(data, undefined, {
        parseNumber(value) {
          const parsed = parseNumber(value);
          if (typeof parsed === 'string') {
            preservedNumbers.add(value);
          }
          return parsed;
        },
        onDuplicateKey: ({ newValue }) => newValue,
      });
      const protectedJson = data.replace(JSON_TOKENS, (token) =>
        preservedNumbers.has(token) ? JSON.stringify(token) : token,
      );
      return JSON.parse(protectedJson) as unknown;
    } catch (error) {
      if (!(error instanceof SyntaxError)) {
        throw error;
      }
    }

    // Retain Axios's existing handling of non-JSON and malformed responses.
    const defaults = axios.defaults.transformResponse;
    const transformers = Array.isArray(defaults) ? defaults : [defaults];
    let result: unknown = data;
    for (const transform of transformers) {
      if (transform) {
        result = transform.call(this, result, headers, status);
      }
    }
    return result;
  };
