// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GeoJSONLoaderDefinition} from './geojson-loader-definition';

export type {GeoJSONLoaderOptions} from './geojson-loader-definition';

/** Preloads the parser-bearing GeoJSON loader implementation. */
async function preload() {
  const {GeoJSONLoaderWithParser} = await import('@loaders.gl/tables/geojson/parser');
  return GeoJSONLoaderWithParser;
}

/** Starts the GeoJSON decoder on an on-demand browser worker. */
function loadGeoJSONWorker(): Worker | null {
  if (typeof Worker !== 'undefined') {
    return new Worker(new URL('../geojson-worker.js', import.meta.url), {type: 'module'});
  }
  return null;
}

/** Metadata-only GeoJSON loader with an on-demand browser worker. */
export const GeoJSONLoader = {
  ...GeoJSONLoaderDefinition,
  loadWorker: loadGeoJSONWorker,
  preload
} as const;
