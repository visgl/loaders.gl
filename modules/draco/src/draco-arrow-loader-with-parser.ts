// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrowTable} from '@loaders.gl/schema';
import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {DracoLoaderOptions} from './draco-loader';
import {DracoLoaderWithParser} from './draco-loader-with-parser';
import {convertMeshToTable} from '@loaders.gl/schema-utils';
import {DracoArrowLoader as DracoArrowLoaderMetadata} from './draco-arrow-loader';

const {preload: _DracoArrowLoaderPreload, ...DracoArrowLoaderMetadataWithoutPreload} =
  DracoArrowLoaderMetadata;

/**
 * Loader for Draco3D compressed geometries
 */
export const DracoArrowLoaderWithParser = {
  ...DracoArrowLoaderMetadataWithoutPreload,
  parse
} as const satisfies LoaderWithParser<ArrowTable, never, DracoLoaderOptions>;

async function parse(arrayBuffer: ArrayBuffer, options?: DracoLoaderOptions): Promise<ArrowTable> {
  const mesh = await DracoLoaderWithParser.parse(arrayBuffer, options);
  const arrowTable = convertMeshToTable(mesh, 'arrow-table');
  return arrowTable;
}
