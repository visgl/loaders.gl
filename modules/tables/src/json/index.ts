// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type {JSONLoaderOptions} from './json-loader-definition';
export {JSONFormat, GeoJSONFormat, NDJSONFormat, NDGeoJSONFormat} from './json-format';
export {JSONLoader} from './json-loader-types';
export type {JSONTableLoaderOptions} from './json-table-loader-definition';
export {JSONTableLoader} from './json-table-loader-types';
export {
  JSONTableSource,
  type JSONTableSourceOptions
} from './json-table-source';
export type {NDJSONLoaderOptions} from './ndjson-loader-definition';
export {NDJSONLoader} from './ndjson-loader-types';
export {NDGeoJSONLoader, type NDGeoJSONLoaderOptions} from './ndgeojson-loader-types';
export {NDJSONTableSource} from './ndjson-source';
export type {NDJSONSourceOptions} from './ndjson-source';
export type {
  ArrowConversionOptions,
  GeoJSONArrowConversionOptions,
  JSONArrowConversionOptions,
  JSONArrowSchema
} from './lib/parsers/convert-row-table-to-arrow';

export type {JSONWriterOptions} from './json-writer';
export {JSONWriter} from './json-writer';

export {GeoJSONLoader} from '../geojson';
export type {GeoJSONLoaderOptions} from './geojson-loader-definition';
export {GeoJSONWriter, type GeoJSONWriterOptions} from './geojson-writer';

export {default as _JSONPath} from './lib/jsonpath/jsonpath';
export {default as _ClarinetParser} from './lib/clarinet/clarinet';
export {default as _FastStreamingJSONParser} from './lib/json-parser/fast-streaming-json-parser';

export {rebuildJsonObject as _rebuildJsonObject} from './lib/parsers/parse-json-in-batches';

export type {MetadataBatch, JSONBatch} from './json-loader-definition';

export {FastJSONLoader} from './fast-json-loader';

export {JSONLoaderWithParser} from '../json-loader';

export type {NDJSONShape} from './ndjson-loader-definition';

export {JSONTableLoaderWithParser} from '../json-table-loader';
export {
  convertJSONToArrow,
  type ConvertJSONToArrowOptions
} from './lib/parsers/convert-json-to-arrow';

export {NDJSONLoaderWithParser} from '../ndjson-loader';
