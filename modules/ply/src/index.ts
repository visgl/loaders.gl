// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {PLYMesh} from './lib/ply-types';
import type {PLYLoaderOptions} from './ply-loader';
import {PLYLoader as PLYWorkerLoader} from './ply-loader';
import {parsePLY} from './lib/parse-ply';
import {parsePLYInBatches} from './lib/parse-ply-in-batches';

// PLYLoader

export type {PLYLoaderOptions};

export {PLYWorkerLoader};

/**
 * Loader for PLY - Polygon File Format
 */
export const PLYLoader = {
  ...PLYWorkerLoader,
  // Note: parsePLY supports both text and binary
  parse: async (arrayBuffer, options) => parsePLY(arrayBuffer, options?.ply), // TODO - this may not detect text correctly?
  parseTextSync: (arrayBuffer, options) => parsePLY(arrayBuffer, options?.ply),
  parseSync: (arrayBuffer, options) => parsePLY(arrayBuffer, options?.ply),
  parseInBatches: (arrayBuffer, options) => parsePLYInBatches(arrayBuffer, options?.ply)
} as const satisfies LoaderWithParser<PLYMesh, any, PLYLoaderOptions>;
