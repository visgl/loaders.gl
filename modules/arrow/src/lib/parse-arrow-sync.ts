import type {ColumnarTable, ObjectRowTable} from '@loaders.gl/schema';
import type {ArrowTable} from './arrow-table';
import {convertTable} from '@loaders.gl/schema';
import * as arrow from 'apache-arrow';
import type {ArrowLoaderOptions} from '../arrow-loader';
import {
  convertApacheArrowToArrowTable,
  convertArrowToColumnarTable
} from '../tables/convert-arrow-to-table';

// Parses arrow to a columnar table
export default function parseArrowSync(
  arrayBuffer,
  options?: ArrowLoaderOptions
): ArrowTable | ColumnarTable | ObjectRowTable {
  const apacheArrowTable = arrow.tableFromIPC([new Uint8Array(arrayBuffer)]);
  const arrowTable = convertApacheArrowToArrowTable(apacheArrowTable);

  const shape = options?.arrow?.shape || 'arrow-table';
  switch (shape) {
    case 'arrow-table':
      return arrowTable;

    case 'columnar-table':
      return convertArrowToColumnarTable(arrowTable);

    case 'object-row-table':
      const columnarTable = convertArrowToColumnarTable(arrowTable);
      return convertTable(columnarTable, 'object-row-table');

    default:
      // TODO
      throw new Error(shape);
  }
}
