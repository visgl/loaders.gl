// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createFlatGeobufSource} from './flatgeobuf-source';
import type {Table, RecordBatch} from 'apache-arrow';
import type {GeoJSONTable, ColumnarTable, BinaryFeatureCollection} from '@loaders.gl/core/schema';
import type {Loader, LoaderWithParser} from '@loaders.gl/core/loader-utils';
import {parseFlatGeobuf, ParseFlatGeobufOptions} from './lib/parse-flatgeobuf';
import {
  FlatGeobufLoaderDefinition,
  type FlatGeobufLoaderOptions
} from './flatgeobuf-loader-definition';
import {
  deserializeFlatGeobufWorkerResult,
  serializeFlatGeobufWorkerResult
} from './lib/flatgeobuf-worker-transport';

export type {FlatGeobufLoaderOptions} from './flatgeobuf-loader-definition';

/** Load flatgeobuf on a worker */
export const FlatGeobufWorkerLoaderWithParser = {
  ...FlatGeobufLoaderDefinition
} as const satisfies Loader<
  GeoJSONTable | ColumnarTable | Table | BinaryFeatureCollection,
  RecordBatch,
  FlatGeobufLoaderOptions
>;

/** Parser-bearing loader for FlatGeobuf files. */
export const FlatGeobufLoaderWithParser = {
  createDataSourceSync: createFlatGeobufSource,
  ...FlatGeobufLoaderDefinition,
  parse: async (arrayBuffer: ArrayBuffer, options: FlatGeobufLoaderOptions = {}) =>
    parseSync(arrayBuffer, options),
  parseSync,
  serializeWorkerResult: serializeFlatGeobufWorkerResult,
  deserializeWorkerResult: deserializeFlatGeobufWorkerResult
} as const satisfies LoaderWithParser<GeoJSONTable | ColumnarTable | Table | BinaryFeatureCollection, RecordBatch, FlatGeobufLoaderOptions>;

function parseSync(arrayBuffer: ArrayBuffer, options: FlatGeobufLoaderOptions = {}) {
  return parseFlatGeobuf(arrayBuffer, getOptions(options));
}

function getOptions(options: FlatGeobufLoaderOptions): ParseFlatGeobufOptions {
  options = {
    ...options,
    flatgeobuf: {...FlatGeobufLoaderWithParser.options.flatgeobuf, ...options?.flatgeobuf},
    gis: {...FlatGeobufLoaderWithParser.options.gis, ...options?.gis}
  };
  return {
    shape: options?.flatgeobuf?.shape ?? 'arrow',
    boundingBox: options?.flatgeobuf?.boundingBox,
    targetCrs: options?.gis?.targetCrs || 'WGS84',
    reproject: options?.gis?.reproject || false,
    geoarrow: options?.geoarrow || options?.flatgeobuf?.geoarrow
  };
}
