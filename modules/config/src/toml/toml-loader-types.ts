// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {TOMLLoaderOptions} from './toml-loader-options';
import {TOMLFormat} from './toml-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Preloads the parser-bearing TOML loader implementation. */
async function preload() {
  const {TOMLLoaderWithParser} = await import('@loaders.gl/config/toml-loader');
  return TOMLLoaderWithParser;
}

/** Metadata-only loader for TOML documents. */
export const TOMLLoader = {
  dataType: null as unknown,
  batchType: null as never,

  ...TOMLFormat,
  version: VERSION,
  options: {
    toml: {}
  },
  preload
} as const satisfies Loader<unknown, never, TOMLLoaderOptions>;
