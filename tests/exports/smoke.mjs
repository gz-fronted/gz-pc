import {
  configureGzFetch,
  createGzFetch,
  GzFetchFeedbackProvider,
  GzFetchUnauthorizedModal,
  gzFetch,
} from '@gz-fronted/gz-pc/fetch';
import { useRequest } from '@gz-fronted/gz-pc/hooks';
import {
  formatDate,
  objectToQuery,
  queryToObject,
} from '@gz-fronted/gz-pc/utils';
import { createRequire } from 'node:module';

if (
  typeof createGzFetch !== 'function' ||
  typeof configureGzFetch !== 'function' ||
  typeof GzFetchFeedbackProvider !== 'function' ||
  typeof GzFetchUnauthorizedModal !== 'function' ||
  typeof gzFetch !== 'function' ||
  typeof useRequest !== 'function' ||
  typeof formatDate !== 'function' ||
  typeof objectToQuery !== 'function' ||
  typeof queryToObject !== 'function'
) {
  throw new TypeError('One or more package subpath exports are invalid.');
}

const require = createRequire(import.meta.url);
const fetchCjs = require('@gz-fronted/gz-pc/fetch');
const hooksCjs = require('@gz-fronted/gz-pc/hooks');
const utilsCjs = require('@gz-fronted/gz-pc/utils');

if (
  typeof fetchCjs.createGzFetch !== 'function' ||
  typeof fetchCjs.configureGzFetch !== 'function' ||
  typeof fetchCjs.GzFetchFeedbackProvider !== 'function' ||
  typeof fetchCjs.GzFetchUnauthorizedModal !== 'function' ||
  typeof fetchCjs.gzFetch !== 'function' ||
  typeof hooksCjs.useRequest !== 'function' ||
  typeof utilsCjs.formatDate !== 'function' ||
  typeof utilsCjs.objectToQuery !== 'function' ||
  typeof utilsCjs.queryToObject !== 'function'
) {
  throw new TypeError('One or more CommonJS subpath exports are invalid.');
}

console.log('ESM and CommonJS package subpath exports are valid.');
