// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Purpose: include this in your module to avoids adding dependencies on
// micro modules like 'global' and 'is-browser';

/* eslint-disable no-restricted-globals */
const globals = {
  self: typeof self !== 'undefined' && self,
  window: typeof window !== 'undefined' && window,
  global: typeof global !== 'undefined' && global,
  document: typeof document !== 'undefined' && document
};

const self_: {[key: string]: any} = globals.self || globals.window || globals.global || {};
const window_: {[key: string]: any} = globals.window || globals.self || globals.global || {};
const global_: {[key: string]: any} = globals.global || globals.self || globals.window || {};
const document_: {[key: string]: any} = globals.document || {};

export {self_ as self, window_ as window, global_ as global, document_ as document};

/** true if running in the browser, false if running in Node.js */
export const isBrowser: boolean =
  // @ts-ignore process.browser
  typeof process !== 'object' || String(process) !== '[object process]' || process.browser;

/** true if running on a worker thread */
export const isWorker: boolean = typeof importScripts === 'function';

/** true if running on a mobile device */
export const isMobile: boolean =
  typeof window !== 'undefined' && typeof window.orientation !== 'undefined';

// Extract node major version
const matches =
  typeof process !== 'undefined' && process.version && /v([0-9]*)/.exec(process.version);

/** Version of Node.js if running under Node, otherwise 0 */
export const nodeVersion: number = (matches && parseFloat(matches[1])) || 0;
