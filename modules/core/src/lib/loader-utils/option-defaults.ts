// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderOptions} from '@loaders.gl/loader-utils';
import {isBrowser} from '@loaders.gl/loader-utils';
import {ConsoleLog} from './loggers';

export const DEFAULT_LOADER_OPTIONS: LoaderOptions = {
  // baseUri
  fetch: null,
  mimeType: undefined,
  nothrow: false,
  log: new ConsoleLog(), // A probe.gl compatible (`log.log()()` syntax) that just logs to console
  useLocalLibraries: false,

  CDN: 'https://unpkg.com/@loaders.gl',
  worker: true, // By default, use worker if provided by loader.
  maxConcurrency: 3, // How many worker instances should be created for each loader.
  maxMobileConcurrency: 1, // How many worker instances should be created for each loader on mobile devices.
  reuseWorkers: isBrowser, // By default reuse workers in browser (Node.js refuses to terminate if browsers are running)
  _nodeWorkers: false, // By default do not support node workers
  _workerType: '', // 'test' to use locally generated workers

  limit: 0,
  _limitMB: 0,
  batchSize: 'auto',
  batchDebounceMs: 0,
  metadata: false, // TODO - currently only implemented for parseInBatches, adds initial metadata batch,
  transforms: []
};

export const REMOVED_LOADER_OPTIONS = {
  throws: 'nothrow',
  dataType: '(no longer used)',
  uri: 'baseUri',
  // Warn if fetch options are used on top-level
  method: 'fetch.method',
  headers: 'fetch.headers',
  body: 'fetch.body',
  mode: 'fetch.mode',
  credentials: 'fetch.credentials',
  cache: 'fetch.cache',
  redirect: 'fetch.redirect',
  referrer: 'fetch.referrer',
  referrerPolicy: 'fetch.referrerPolicy',
  integrity: 'fetch.integrity',
  keepalive: 'fetch.keepalive',
  signal: 'fetch.signal'
};
