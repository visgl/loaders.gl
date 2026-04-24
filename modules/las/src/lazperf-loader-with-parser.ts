// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// LASER (LAS) FILE FORMAT
import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {LASLoaderOptions} from './las-loader';
import type {LASMesh} from './lib/las-types';
import {parseLAS} from './lib/laz-perf/parse-las';
import {LAZPerfLoader as LAZPerfLoaderMetadata} from './lazperf-loader';

const {preload: _LAZPerfLoaderPreload, ...LAZPerfLoaderMetadataWithoutPreload} =
  LAZPerfLoaderMetadata;

/**
 * Loader for the LAS (LASer) point cloud format
 * @note Does not support LAS v1.4
 */
export const LAZPerfLoaderWithParser = {
  ...LAZPerfLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: LASLoaderOptions) =>
    parseLAS(arrayBuffer, options),
  parseSync: (arrayBuffer: ArrayBuffer, options?: LASLoaderOptions) =>
    parseLAS(arrayBuffer, options)
} as const satisfies LoaderWithParser<LASMesh, never, LASLoaderOptions>;
