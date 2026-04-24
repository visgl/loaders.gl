// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// PLY Loader
import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {PLYMesh} from './lib/ply-types';
import type {ParsePLYOptions} from './lib/parse-ply';
import {parsePLY} from './lib/parse-ply';
import {parsePLYInBatches} from './lib/parse-ply-in-batches';
import {PLYWorkerLoader as PLYWorkerLoaderMetadata} from './ply-loader';
import {PLYLoader as PLYLoaderMetadata} from './ply-loader';

const {preload: _PLYWorkerLoaderPreload, ...PLYWorkerLoaderMetadataWithoutPreload} =
  PLYWorkerLoaderMetadata;
const {preload: _PLYLoaderPreload, ...PLYLoaderMetadataWithoutPreload} = PLYLoaderMetadata;

export type PLYLoaderOptions = LoaderOptions & {
  ply?: ParsePLYOptions & {
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
};

/**
 * Worker loader for PLY - Polygon File Format (aka Stanford Triangle Format)'
 * links: ['http://paulbourke.net/dataformats/ply/',
 * 'https://en.wikipedia.org/wiki/PLY_(file_format)']
 */
export const PLYWorkerLoaderWithParser = {
  ...PLYWorkerLoaderMetadataWithoutPreload
} as const satisfies Loader<PLYMesh, never, LoaderOptions>;

/**
 * Loader for PLY - Polygon File Format
 */
export const PLYLoaderWithParser = {
  ...PLYLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer, options) => parsePLY(arrayBuffer, options?.ply),
  parseTextSync: (arrayBuffer, options) => parsePLY(arrayBuffer, options?.ply),
  parseSync: (arrayBuffer, options) => parsePLY(arrayBuffer, options?.ply),
  parseInBatches: (
    arrayBuffer:
      | AsyncIterable<ArrayBufferLike | ArrayBufferView>
      | Iterable<ArrayBufferLike | ArrayBufferView>,
    options
  ) => parsePLYInBatches(arrayBuffer, options?.ply)
} as const satisfies LoaderWithParser<PLYMesh, any, PLYLoaderOptions>;
