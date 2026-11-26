// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type {GeoJSONLoaderOptions} from './json/geojson-loader-definition';
import {GeoJSONLoader as GeoJSONLoaderMetadata} from './json/geojson-loader-types';
import {
  deserializeGeoJSONWorkerResult,
  serializeGeoJSONWorkerResult
} from './json/lib/geojson-worker-transport';

/** Compatibility metadata retains Arrow worker transport hooks. */
export const GeoJSONLoader = {
  ...GeoJSONLoaderMetadata,
  serializeWorkerResult: serializeGeoJSONWorkerResult,
  deserializeWorkerResult: deserializeGeoJSONWorkerResult
} as const;

export type {GeoJSONWriterOptions} from './json/geojson-writer';
export {GeoJSONWriter} from './json/geojson-writer';

export {GeoJSONFormat, NDGeoJSONFormat} from './json/json-format';
export {NDGeoJSONLoader, type NDGeoJSONLoaderOptions} from './json/ndgeojson-loader-types';

export {GeoJSONWorkerLoaderWithParser, GeoJSONLoaderWithParser} from './geojson-loader';

export {NDGeoJSONLoaderWithParser} from './json/ndgeojson-loader';
