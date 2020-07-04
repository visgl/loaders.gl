/* eslint-disable no-restricted-globals */
/* global process, window, global, document, self, importScripts */
const global_ =
  typeof globalThis !== 'undefined'
    ? globalThis
    : typeof window !== 'undefined'
      ? window
      : typeof global !== 'undefined'
        ? global
        : typeof self !== 'undefined'
          ? self
          : {};

const document_ = global_.document || {};

const isBrowser =
  // @ts-ignore
  typeof process !== 'object' || String(process) !== '[object process]' || process.browser;
const isWorker = typeof importScripts === 'function';

export {global_ as global, document_ as document, isBrowser, isWorker};
