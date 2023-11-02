import * as arrow from 'apache-arrow';
import {AnyArrayType, VECTOR_TYPES} from '../types';

export type ColumnarTable = {
  name: string;
  array: AnyArrayType;
  type: number;
}[];

/**
 * Encodes set of arrays into the Apache Arrow columnar format
 * https://arrow.apache.org/docs/format/Columnar.html#ipc-file-format
 * @param data - columns data
 * @param options - the writer options
 * @returns - encoded ArrayBuffer
 */
export function encodeArrowSync(data: ColumnarTable): ArrayBuffer {
  const vectors: Record<string, arrow.Vector> = {};
  for (const arrayData of data) {
    const arrayVector = createVector(arrayData.array, arrayData.type);
    vectors[arrayData.name] = arrayVector;
  }
  const table = new arrow.Table(vectors);
  const arrowBuffer = arrow.tableToIPC(table);
  return arrowBuffer;
}

/**
 * Create Arrow arrow.Vector from given data and vector type
 * @param array {import('../types').AnyArrayType} - columns data
 * @param type {number} - the writer options
 * @return a vector of one of vector's types defined in the Apache Arrow library
 */
function createVector(array, type): arrow.Vector {
  switch (type) {
    case VECTOR_TYPES.DATE:
      return arrow.vectorFromArray(array);
    case VECTOR_TYPES.FLOAT:
    default:
      return arrow.vectorFromArray(array);
  }
}
