// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import {RADFormat} from './splats-format';
import type {RADMetadata} from './lib/parse-rad';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Preloads the parser-bearing RAD loader implementation. */
async function preload() {
  const {RADLoaderWithParser} = await import('./rad-loader');
  return RADLoaderWithParser;
}

/** Metadata-only loader for Spark `.rad` paged LoD Gaussian splat containers. */
export const RADLoader = {
  dataType: null as unknown as RADMetadata,
  batchType: null as never,
  ...RADFormat,
  version: VERSION,
  options: {},
  preload
} as const satisfies Loader<RADMetadata, never, LoaderOptions>;
