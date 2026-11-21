// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GeoArrowLoaderDefinition} from './geoarrow-loader-definition';

export type {GeoArrowLoaderOptions} from './geoarrow-loader-definition';

/** Preloads the parser-bearing GeoArrow loader implementation. */
async function preload() {
  const {GeoArrowLoaderWithParser} = await import('@loaders.gl/tables/geoarrow');
  const {preloadArrowCompressionDecoders} = await import('./lib/parsers/arrow-compression');
  await preloadArrowCompressionDecoders();
  return {...GeoArrowLoaderWithParser, loadWorker: loadGeoArrowWorker};
}

/** Starts the browser module worker for GeoArrow decoding. */
function loadGeoArrowWorker(): Worker | null {
  if (typeof Worker !== 'undefined') {
    return new Worker(new URL('./workers/geoarrow-worker.js', import.meta.url), {type: 'module'});
  }
  return null;
}

/** Metadata-only GeoArrow loader with an on-demand browser worker. */
export const GeoArrowLoader = {
  ...GeoArrowLoaderDefinition,
  loadWorker: loadGeoArrowWorker,
  preload
} as const;
