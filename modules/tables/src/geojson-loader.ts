// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GeoJSONLoader} from './json/geojson-loader-types.js';
import {
  GeoJSONLoaderWithParser as parser,
  GeoJSONWorkerLoaderWithParser as workerParser
} from './json/geojson-loader.js';

export * from './json/geojson-loader.js';

/** Parser-bearing GeoJSON loader with its browser module worker factory. */
export const GeoJSONLoaderWithParser = {
  ...parser,
  loadWorker: GeoJSONLoader.loadWorker
};

/** Public worker descriptor for GeoJSON, with the same local parser preload. */
export const GeoJSONWorkerLoaderWithParser = {
  ...workerParser,
  loadWorker: GeoJSONLoader.loadWorker,
  preload: GeoJSONLoader.preload
};
