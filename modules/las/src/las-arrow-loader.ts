// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {ArrowTable} from '@loaders.gl/schema';

import {LASLoaderOptions, LASLoader} from './las-loader';
import {convertMeshToTable} from '@loaders.gl/schema-utils';

/**
 * Worker loader for LAS - Point Cloud Data
 */
export const LASArrowLoader = {
  ...LASLoader,
  dataType: null as unknown as ArrowTable,
  batchType: null as never,
  worker: false,
  parse: async (arrayBuffer: ArrayBuffer) => {
    const mesh = await LASLoader.parse(arrayBuffer);
    const arrowTable = convertMeshToTable(mesh, 'arrow-table');
    return arrowTable;
  }
} as const satisfies LoaderWithParser<ArrowTable, never, LASLoaderOptions>;
