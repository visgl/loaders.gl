// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  serializeArrowWorkerResult,
  deserializeArrowWorkerResult
} from '@loaders.gl/core/arrow-worker-transport';
import type {LoaderWithParser} from '@loaders.gl/core/loader-utils';
import type {Table} from 'apache-arrow';
import type {Mesh} from '@loaders.gl/core/schema';
import {convertMeshToTable, convertTableToMesh} from '@loaders.gl/core/schema-utils';
import {parseQuantizedMesh} from './lib/parse-quantized-mesh';
import {
  QuantizedMeshLoader as QuantizedMeshLoaderMetadata,
  type QuantizedMeshLoaderOptions
} from './quantized-mesh-loader-types';

const {preload: _QuantizedMeshLoaderPreload, ...QuantizedMeshLoaderMetadataWithoutPreload} =
  QuantizedMeshLoaderMetadata;

/**
 * Loader for quantized meshes.
 */
export const QuantizedMeshLoaderWithParser = {
  ...QuantizedMeshLoaderMetadataWithoutPreload,
  serializeWorkerResult: serializeArrowWorkerResult,
  deserializeWorkerResult: deserializeArrowWorkerResult,
  parseSync: parseQuantizedMeshInRequestedShape,
  parse: async (arrayBuffer, options) => parseQuantizedMeshInRequestedShape(arrayBuffer, options)
} as const satisfies LoaderWithParser<Mesh | Table, never, QuantizedMeshLoaderOptions>;

function parseQuantizedMeshInRequestedShape(
  arrayBuffer: ArrayBuffer,
  options?: QuantizedMeshLoaderOptions
): Mesh | Table {
  const mesh = parseQuantizedMesh(arrayBuffer, options?.['quantized-mesh']);
  const table = convertMeshToTable(mesh, 'arrow-table');
  if (options?.['quantized-mesh']?.shape === 'arrow') {
    return table.data;
  }
  return {
    ...convertTableToMesh(table),
    loader: mesh.loader,
    loaderData: mesh.loaderData
  };
}
