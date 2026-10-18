// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/version';

import {VectorSourceInfo, ImageSourceInfo} from './source-info';
import type {PMTilesSourceLoaderOptions} from './pmtiles-source-loader';
import {PMTilesFormat} from './pmtiles-format';

export type PMTilesLoaderOptions = LoaderOptions & {
  pmtiles?: PMTilesSourceLoaderOptions['pmtiles'];
};

/** Preloads the parser-bearing PMTiles loader implementation. */
async function preload() {
  const {PMTilesLoaderWithParser} = await import('./pmtiles-loader-with-parser');
  return PMTilesLoaderWithParser;
}

/** Metadata-only loader for PMTiles metadata. */
export const PMTilesLoader = {
  ...PMTilesFormat,
  version: VERSION,
  options: {
    pmtiles: {}
  },
  preload
} as const satisfies Loader<VectorSourceInfo | ImageSourceInfo, never, PMTilesLoaderOptions>;
