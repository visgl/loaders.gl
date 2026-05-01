// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrowTable, ArrowTableBatch, GeoJSONTable, BinaryFeatureCollection} from '@loaders.gl/schema';
import type {Loader, LoaderWithParser} from '@loaders.gl/loader-utils';
import {parseFlatGeobuf, ParseFlatGeobufOptions} from './lib/parse-flatgeobuf';
import {
  FlatGeobufWorkerLoader as FlatGeobufWorkerLoaderMetadata,
  FlatGeobufLoader as FlatGeobufLoaderMetadata,
  type FlatGeobufLoaderOptions
} from './flatgeobuf-loader';

const {preload: _FlatGeobufWorkerLoaderPreload, ...FlatGeobufWorkerLoaderMetadataWithoutPreload} = FlatGeobufWorkerLoaderMetadata;
const {preload: _FlatGeobufLoaderPreload, ...FlatGeobufLoaderMetadataWithoutPreload} = FlatGeobufLoaderMetadata;


export type {FlatGeobufLoaderOptions} from './flatgeobuf-loader';

/** Load flatgeobuf on a worker */
export const FlatGeobufWorkerLoaderWithParser = {
  ...FlatGeobufWorkerLoaderMetadataWithoutPreload
} as const satisfies Loader<
  GeoJSONTable | ArrowTable | BinaryFeatureCollection,
  ArrowTableBatch | any,
  FlatGeobufLoaderOptions
>;

export const FlatGeobufLoaderWithParser = {
  ...FlatGeobufLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options: FlatGeobufLoaderOptions = {}) =>
    parseSync(arrayBuffer, options),
  parseSync
} as const satisfies LoaderWithParser<any, any, FlatGeobufLoaderOptions>;

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
    shape: options?.flatgeobuf?.shape ?? 'geojson-table',
    boundingBox: options?.flatgeobuf?.boundingBox,
    crs: options?.gis?._targetCrs || 'WGS84',
    reproject: options?.gis?.reproject || false
  };
}
