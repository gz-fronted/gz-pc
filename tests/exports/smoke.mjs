import { createGzFetch } from '@lishenchan/gz-pc/fetch';
import { useRequest } from '@lishenchan/gz-pc/hooks';
import { formatDate } from '@lishenchan/gz-pc/utils';
import { createRequire } from 'node:module';

if (
  typeof createGzFetch !== 'function' ||
  typeof useRequest !== 'function' ||
  typeof formatDate !== 'function'
) {
  throw new TypeError('One or more package subpath exports are invalid.');
}

const require = createRequire(import.meta.url);
const fetchCjs = require('@lishenchan/gz-pc/fetch');
const hooksCjs = require('@lishenchan/gz-pc/hooks');
const utilsCjs = require('@lishenchan/gz-pc/utils');

if (
  typeof fetchCjs.createGzFetch !== 'function' ||
  typeof hooksCjs.useRequest !== 'function' ||
  typeof utilsCjs.formatDate !== 'function'
) {
  throw new TypeError('One or more CommonJS subpath exports are invalid.');
}

console.log('ESM and CommonJS package subpath exports are valid.');
