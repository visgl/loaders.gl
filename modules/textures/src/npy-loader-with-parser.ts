// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {parseNPY, NPYTile} from './lib/parsers/parse-npy';
import {NPYWorkerLoader as NPYWorkerLoaderMetadata} from './npy-loader';
import {NPYLoader as NPYLoaderMetadata} from './npy-loader';

const {preload: _NPYWorkerLoaderPreload, ...NPYWorkerLoaderMetadataWithoutPreload} =
  NPYWorkerLoaderMetadata;
const {preload: _NPYLoaderPreload, ...NPYLoaderMetadataWithoutPreload} = NPYLoaderMetadata;

// \x93NUMPY

/** NPYLoaderWithParser for numpy tiles */
export type NPYLoaderOptions = LoaderOptions & {
  /** NPYLoaderWithParser for numpy tiles */
  npy?: {
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
};

/**
 * Worker loader for numpy "tiles"
 */
export const NPYWorkerLoaderWithParser = {
  ...NPYWorkerLoaderMetadataWithoutPreload
} as const satisfies Loader<NPYTile, never, NPYLoaderOptions>;

/**
 * Loader for numpy "tiles"
 */
export const NPYLoaderWithParser = {
  ...NPYLoaderMetadataWithoutPreload,
  parseSync: parseNPY,
  parse: async (arrayBuffer: ArrayBuffer, options?: LoaderOptions) => parseNPY(arrayBuffer, options)
} as const satisfies LoaderWithParser<any, any, NPYLoaderOptions>;
