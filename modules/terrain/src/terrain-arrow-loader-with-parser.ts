// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderContext, LoaderWithParser} from '@loaders.gl/loader-utils';
import type {MeshArrowTable} from '@loaders.gl/schema';
import {convertMeshToTable} from '@loaders.gl/schema-utils';
import {TerrainArrowLoader as TerrainArrowLoaderMetadata} from './terrain-arrow-loader';
import type {TerrainLoaderOptions} from './terrain-loader';
import {parseTerrain} from './terrain-loader-with-parser';

export type {TerrainLoaderOptions} from './terrain-loader';

const {preload: _TerrainArrowLoaderPreload, ...TerrainArrowLoaderMetadataWithoutPreload} =
  TerrainArrowLoaderMetadata;

/**
 * Loader for height-map terrain meshes as Apache Arrow tables.
 */
export const TerrainArrowLoaderWithParser = {
  ...TerrainArrowLoaderMetadataWithoutPreload,
  parse: parseTerrainArrow
} as const satisfies LoaderWithParser<MeshArrowTable, never, TerrainLoaderOptions>;

/** Parse a height-map terrain mesh as an Apache Arrow table. */
async function parseTerrainArrow(
  arrayBuffer: ArrayBuffer,
  options?: TerrainLoaderOptions,
  context?: LoaderContext
): Promise<MeshArrowTable> {
  const mesh = await parseTerrain(arrayBuffer, options, context);
  return convertMeshToTable(mesh, 'arrow-table');
}
