// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GeoJSONLoader} from './json/geojson-loader-types.js';
import {GeoJSONLoaderWithParser as parser} from './json/geojson-loader.js';

export * from './json/geojson-loader.js';

/** Parser-bearing GeoJSON loader with its browser module worker factory. */
export const GeoJSONLoaderWithParser = {
  ...parser,
  loadWorker: GeoJSONLoader.loadWorker
};
