// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {Mesh} from '@loaders.gl/schema';
import {parseQuantizedMesh} from './lib/parse-quantized-mesh';
import {
  QuantizedMeshLoader as QuantizedMeshLoaderMetadata,
  type QuantizedMeshLoaderOptions
} from './quantized-mesh-loader';

const {preload: _QuantizedMeshLoaderPreload, ...QuantizedMeshLoaderMetadataWithoutPreload} =
  QuantizedMeshLoaderMetadata;

/**
 * Loader for quantized meshes.
 */
export const QuantizedMeshLoaderWithParser = {
  ...QuantizedMeshLoaderMetadataWithoutPreload,
  parseSync: (arrayBuffer, options) => parseQuantizedMesh(arrayBuffer, options?.['quantized-mesh']),
  parse: async (arrayBuffer, options) =>
    parseQuantizedMesh(arrayBuffer, options?.['quantized-mesh'])
} as const satisfies LoaderWithParser<Mesh, never, QuantizedMeshLoaderOptions>;
