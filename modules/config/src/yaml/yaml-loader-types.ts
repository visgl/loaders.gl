// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {YAMLLoaderOptions} from './yaml-loader-options';
import {YAMLFormat} from './yaml-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Preloads the parser-bearing YAML loader implementation. */
async function preload() {
  const {YAMLLoaderWithParser} = await import('@loaders.gl/config/yaml-loader');
  return YAMLLoaderWithParser;
}

/** Metadata-only loader for YAML documents. */
export const YAMLLoader = {
  dataType: null as unknown,
  batchType: null as never,

  ...YAMLFormat,
  version: VERSION,
  options: {
    yaml: {}
  },
  preload
} as const satisfies Loader<unknown, never, YAMLLoaderOptions>;
