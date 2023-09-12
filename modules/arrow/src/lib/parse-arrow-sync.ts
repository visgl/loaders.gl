import type {ArrowTable, ColumnarTable, ObjectRowTable} from '@loaders.gl/schema';
import {convertTable} from '@loaders.gl/schema';
import {tableFromIPC} from 'apache-arrow';
import type {ArrowLoaderOptions} from '../arrow-loader';
import {convertApacheArrowToArrowTable, convertArrowToColumnarTable} from './convert-table';

// Parses arrow to a columnar table
export default function parseArrowSync(
  arrayBuffer,
  options?: ArrowLoaderOptions
): ArrowTable | ColumnarTable | ObjectRowTable {
  const apacheArrowTable = tableFromIPC([new Uint8Array(arrayBuffer)]);
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
