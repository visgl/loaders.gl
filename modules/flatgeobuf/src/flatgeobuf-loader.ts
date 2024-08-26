// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GeoJSONTable, BinaryFeatureCollection} from '@loaders.gl/schema';
import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {
  parseFlatGeobuf,
  parseFlatGeobufInBatches,
  ParseFlatGeobufOptions
} from './lib/parse-flatgeobuf';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

// FGB\3FGB\1
const FGB_MAGIC_NUMBER = [0x66, 0x67, 0x62, 0x03, 0x66, 0x67, 0x62, 0x01];

export type FlatGeobufLoaderOptions = LoaderOptions & {
  flatgeobuf?: {
    shape?: 'geojson-table' | 'columnar-table' | 'binary';
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
    boundingBox?: [[number, number], [number, number]];
  };
  gis?: {
    reproject?: boolean;
    _targetCrs?: string;
  };
};

/** Load flatgeobuf on a worker */
export const FlatGeobufWorkerLoader = {
  dataType: null as any,
  batchType: null as any,

  id: 'flatgeobuf',
  name: 'FlatGeobuf',
  module: 'flatgeobuf',
  version: VERSION,
  worker: true,
  extensions: ['fgb'],
  mimeTypes: ['application/octet-stream'],
  category: 'geometry',
  tests: [new Uint8Array(FGB_MAGIC_NUMBER).buffer],
  options: {
    flatgeobuf: {
      shape: 'geojson-table'
    },
    gis: {
      reproject: false
    }
  }
} as const satisfies Loader<GeoJSONTable | BinaryFeatureCollection, any, FlatGeobufLoaderOptions>;

export const FlatGeobufLoader = {
  ...FlatGeobufWorkerLoader,
  parse: async (arrayBuffer: ArrayBuffer, options: FlatGeobufLoaderOptions = {}) =>
    parseSync(arrayBuffer, options),
  parseSync,
  // @ts-expect-error this is a stream parser not an async iterator parser
  parseInBatchesFromStream,
  binary: true
} as const satisfies LoaderWithParser<any, any, FlatGeobufLoaderOptions>;

function parseSync(arrayBuffer: ArrayBuffer, options: FlatGeobufLoaderOptions = {}) {
  return parseFlatGeobuf(arrayBuffer, getOptions(options));
}

function parseInBatchesFromStream(stream: any, options: FlatGeobufLoaderOptions) {
  return parseFlatGeobufInBatches(stream, getOptions(options));
}

function getOptions(options: FlatGeobufLoaderOptions): ParseFlatGeobufOptions {
  options = {
    ...options,
    flatgeobuf: {...FlatGeobufLoader.options.flatgeobuf, ...options?.flatgeobuf},
    gis: {...FlatGeobufLoader.options.gis, ...options?.gis}
  };
  return {
    shape: options?.flatgeobuf?.shape ?? 'geojson-table',
    boundingBox: options?.flatgeobuf?.boundingBox,
    crs: options?.gis?._targetCrs || 'WGS84',
    reproject: options?.gis?.reproject || false
  };
}
