// loaders.gl, MIT License

import {allSettled} from './promise/all-settled';

if (!('allSettled' in Promise)) {
  // @ts-ignore
  Promise.allSettled = allSettled;
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function installFilePolyfills() {}

// Dummy export to avoid import errors in browser tests
export const NodeFileSystem = null;
