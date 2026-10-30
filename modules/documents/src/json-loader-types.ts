// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/core/loader-utils';
import {JSONFormat} from './json-format';

// @ts-ignore __VERSION__ is injected by the package build.
const VERSION = __VERSION__;

/** Options for ordinary JSON documents; table-specific options are intentionally absent. */
export type JSONLoaderOptions = LoaderOptions;

/** Loads the native JSON parser only when requested. */
async function preload() {
  const {JSONLoaderWithParser} = await import('@loaders.gl/documents/json-loader');
  return JSONLoaderWithParser;
}

/** Lightweight generic JSON loader metadata. Scalars, arrays, objects and null stay JSON values. */
export const JSONLoader = {
  ...JSONFormat,
  version: VERSION,
  dataType: null as unknown,
  batchType: null as never,
  options: {},
  preload
} as const satisfies Loader<unknown, never, JSONLoaderOptions>;
