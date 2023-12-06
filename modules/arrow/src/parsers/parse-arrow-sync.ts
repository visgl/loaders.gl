// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import type {ArrayRowTable, ColumnarTable, ObjectRowTable} from '@loaders.gl/schema';
import type {ArrowTable} from '../lib/arrow-table';
import {convertTable} from '@loaders.gl/schema';
import * as arrow from 'apache-arrow';
import {convertArrowToColumnarTable} from '../tables/convert-arrow-to-columnar-table';

// Parses arrow to a columnar table
export function parseArrowSync(
  arrayBuffer,
  options?: {shape?: 'arrow-table' | 'columnar-table' | 'object-row-table' | 'array-row-table'}
): ArrowTable | ColumnarTable | ObjectRowTable | ArrayRowTable {
  const apacheArrowTable = arrow.tableFromIPC([new Uint8Array(arrayBuffer)]);
  const arrowTable: ArrowTable = {shape: 'arrow-table', data: apacheArrowTable};

  const shape = options?.shape || 'arrow-table';
  switch (shape) {
    case 'arrow-table':
      return arrowTable;

    case 'columnar-table':
      return convertArrowToColumnarTable(arrowTable);

    case 'object-row-table':
      let columnarTable = convertArrowToColumnarTable(arrowTable);
      return convertTable(columnarTable, 'object-row-table');

    case 'array-row-table':
      columnarTable = convertArrowToColumnarTable(arrowTable);
      return convertTable(columnarTable, 'array-row-table');

    default:
      // TODO
      throw new Error(shape);
  }
}
