// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrowTable} from '@loaders.gl/schema';
import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {DracoLoaderOptions} from './draco-loader';
import {DracoLoader} from './draco-loader';
import {convertMeshToTable} from '@loaders.gl/schema-utils';

/**
 * Loader for Draco3D compressed geometries
 */
export const DracoArrowLoader = {
  ...DracoLoader,
  dataType: null as unknown as ArrowTable,
  worker: false,
  parse
} as const satisfies LoaderWithParser<ArrowTable, never, DracoLoaderOptions>;

async function parse(arrayBuffer: ArrayBuffer, options?: DracoLoaderOptions): Promise<ArrowTable> {
  const mesh = await DracoLoader.parse(arrayBuffer, options);
  const arrowTable = convertMeshToTable(mesh, 'arrow-table');
  return arrowTable;
}
