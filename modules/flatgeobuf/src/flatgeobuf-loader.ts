// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  ArrowTable,
  ArrowTableBatch,
  GeoJSONTable,
  BinaryFeatureCollection
} from '@loaders.gl/schema';
import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import {FlatGeobufFormat} from './flatgeobuf-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

// FGB\3FGB\1
const FGB_MAGIC_NUMBER = [0x66, 0x67, 0x62, 0x03, 0x66, 0x67, 0x62, 0x01];

export type FlatGeobufLoaderOptions = LoaderOptions & {
  flatgeobuf?: {
    shape?: 'geojson-table' | 'columnar-table' | 'binary' | 'arrow-table';
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
    boundingBox?: [[number, number], [number, number]];
  };
  gis?: {
    reproject?: boolean;
    _targetCrs?: string;
  };
};

/** Preloads the parser-bearing FlatGeobuf loader implementation. */
async function preload() {
  const {FlatGeobufLoaderWithParser} = await import('./flatgeobuf-loader-with-parser');
  return FlatGeobufLoaderWithParser;
}

/** Metadata-only FlatGeobuf worker loader. */
export const FlatGeobufWorkerLoader = {
  ...FlatGeobufFormat,

  dataType: null as any,
  batchType: null as any,
  version: VERSION,
  worker: true,
  workerFile: 'flatgeobuf-classic.js',
  workerModuleFile: 'flatgeobuf-module.js',
  workerNodeFile: 'flatgeobuf-classic-node.cjs',
  tests: [new Uint8Array(FGB_MAGIC_NUMBER).buffer],
  options: {
    flatgeobuf: {
      shape: 'geojson-table'
    },
    gis: {
      reproject: false
    }
  },
  preload
} as const satisfies Loader<
  GeoJSONTable | ArrowTable | BinaryFeatureCollection,
  ArrowTableBatch | any,
  FlatGeobufLoaderOptions
>;

/** Metadata-only FlatGeobuf loader. */
export const FlatGeobufLoader = {
  ...FlatGeobufWorkerLoader,
  binary: true,
  preload
} as const satisfies Loader<any, any, FlatGeobufLoaderOptions>;
