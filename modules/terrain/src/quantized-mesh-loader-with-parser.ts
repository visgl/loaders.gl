// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {Mesh, MeshArrowTable} from '@loaders.gl/schema';
import {convertMeshToTable} from '@loaders.gl/schema-utils';
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
  parseSync: parseQuantizedMeshInRequestedShape,
  parse: async (arrayBuffer, options) => parseQuantizedMeshInRequestedShape(arrayBuffer, options)
} as const satisfies LoaderWithParser<Mesh | MeshArrowTable, never, QuantizedMeshLoaderOptions>;

function parseQuantizedMeshInRequestedShape(
  arrayBuffer: ArrayBuffer,
  options?: QuantizedMeshLoaderOptions
): Mesh | MeshArrowTable {
  const mesh = parseQuantizedMesh(arrayBuffer, options?.['quantized-mesh']);
  return options?.['quantized-mesh']?.shape === 'arrow-table'
    ? convertMeshToTable(mesh, 'arrow-table')
    : mesh;
}
