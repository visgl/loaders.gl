// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import {type MapStyleLoadOptions, type ResolvedMapStyle} from './map-style';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Preloads the parser-bearing map style loader implementation. */
async function preload() {
  const {MapStyleLoaderWithParser} = await import('./map-style-loader-with-parser');
  return MapStyleLoaderWithParser;
}

/** Metadata-only loader for MapLibre / Mapbox style JSON metadata. */
export const MapStyleLoader = {
  dataType: null as unknown as ResolvedMapStyle,
  batchType: null as never,

  name: 'Map Style',
  id: 'map-style',
  module: 'mvt',
  version: VERSION,
  worker: false,
  extensions: ['json'],
  mimeTypes: ['application/json', 'application/vnd.mapbox.style+json'],
  text: true,
  options: {
    mapStyle: {}
  },
  preload
} as const satisfies Loader<ResolvedMapStyle, never, MapStyleLoadOptions>;
