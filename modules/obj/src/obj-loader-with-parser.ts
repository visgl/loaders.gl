// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import type {Mesh} from '@loaders.gl/schema';
import {parseOBJ} from './lib/parse-obj';
import {OBJWorkerLoader as OBJWorkerLoaderMetadata} from './obj-loader';
import {OBJLoader as OBJLoaderMetadata} from './obj-loader';

const {preload: _OBJWorkerLoaderPreload, ...OBJWorkerLoaderMetadataWithoutPreload} =
  OBJWorkerLoaderMetadata;
const {preload: _OBJLoaderPreload, ...OBJLoaderMetadataWithoutPreload} = OBJLoaderMetadata;

export type OBJLoaderOptions = LoaderOptions & {
  obj?: {
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
};

/**
 * Worker loader for the OBJ geometry format
 */
export const OBJWorkerLoaderWithParser = {
  ...OBJWorkerLoaderMetadataWithoutPreload
} as const satisfies Loader<Mesh, never, OBJLoaderOptions>;

// OBJLoaderWithParser

/**
 * Loader for the OBJ geometry format
 */
export const OBJLoaderWithParser = {
  ...OBJLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: OBJLoaderOptions) =>
    parseOBJ(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: (text: string, options?: OBJLoaderOptions) => parseOBJ(text, options)
} as const satisfies LoaderWithParser<Mesh, never, OBJLoaderOptions>;
