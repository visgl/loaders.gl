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
  return GeoArrowLoaderWithParser;
}

/** Starts the browser module worker for GeoArrow decoding. */
function loadGeoArrowWorker(): Worker | null {
  if (typeof Worker !== 'undefined') {
    const moduleUrl = import.meta.url;
    // Native browser workers cannot use the page's import map.
    if (moduleUrl && new URL(moduleUrl).pathname.endsWith('/dist/arrow/geoarrow-loader-types.js')) {
      const workerUrl = new URL('../geoarrow-worker.js', moduleUrl);
      return new Worker(workerUrl, {type: 'module'});
    }
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
