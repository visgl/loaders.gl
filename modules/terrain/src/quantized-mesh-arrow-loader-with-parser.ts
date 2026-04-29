// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {MeshArrowTable} from '@loaders.gl/schema';
import {convertMeshToTable} from '@loaders.gl/schema-utils';
import {parseQuantizedMesh} from './lib/parse-quantized-mesh';
import {QuantizedMeshArrowLoader as QuantizedMeshArrowLoaderMetadata} from './quantized-mesh-arrow-loader';
import type {QuantizedMeshLoaderOptions} from './quantized-mesh-loader';

export type {QuantizedMeshLoaderOptions} from './quantized-mesh-loader';

const {
  preload: _QuantizedMeshArrowLoaderPreload,
  ...QuantizedMeshArrowLoaderMetadataWithoutPreload
} = QuantizedMeshArrowLoaderMetadata;

/**
 * Loader for quantized meshes as Apache Arrow tables.
 */
export const QuantizedMeshArrowLoaderWithParser = {
  ...QuantizedMeshArrowLoaderMetadataWithoutPreload,
  parseSync: parseQuantizedMeshArrow,
  parse: async (arrayBuffer, options) => parseQuantizedMeshArrow(arrayBuffer, options)
} as const satisfies LoaderWithParser<MeshArrowTable, never, QuantizedMeshLoaderOptions>;

/** Parse a quantized mesh as an Apache Arrow table. */
function parseQuantizedMeshArrow(
  arrayBuffer: ArrayBuffer,
  options?: QuantizedMeshLoaderOptions
): MeshArrowTable {
  const mesh = parseQuantizedMesh(arrayBuffer, options?.['quantized-mesh']);
  return convertMeshToTable(mesh, 'arrow-table');
}
