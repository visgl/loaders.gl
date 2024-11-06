// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {ArrowTable} from '@loaders.gl/schema';

import {PLYLoaderOptions, PLYWorkerLoader} from './ply-loader';
import {convertMeshToTable} from '@loaders.gl/schema-utils';
import {parsePLY} from './lib/parse-ply';

/**
 * Worker loader for PLY -
 */
export const PLYArrowLoader = {
  ...PLYWorkerLoader,
  dataType: null as unknown as ArrowTable,
  batchType: null as never,
  worker: false,
  parse: async (arrayBuffer: ArrayBuffer) => {
    const mesh = parsePLY(arrayBuffer);
    const arrowTable = convertMeshToTable(mesh, 'arrow-table');
    return arrowTable;
  }
} as const satisfies LoaderWithParser<ArrowTable, never, PLYLoaderOptions>;
