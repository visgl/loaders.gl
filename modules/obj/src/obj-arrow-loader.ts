// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {ArrowTable} from '@loaders.gl/schema';

import {OBJLoaderOptions, OBJWorkerLoader} from './obj-loader';
import {convertMeshToTable} from '@loaders.gl/schema-utils';
import {parseOBJ} from './lib/parse-obj';

/**
 * Worker loader for OBJ - Point Cloud Data
 */
export const OBJArrowLoader = {
  ...OBJWorkerLoader,
  dataType: null as unknown as ArrowTable,
  batchType: null as never,
  worker: false,
  parse: async (arrayBuffer: ArrayBuffer) => {
    const text = new TextDecoder().decode(arrayBuffer);
    const mesh = parseOBJ(text);
    const arrowTable = convertMeshToTable(mesh, 'arrow-table');
    return arrowTable;
  }
} as const satisfies LoaderWithParser<ArrowTable, never, OBJLoaderOptions>;
