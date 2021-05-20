import {Table, FloatVector, DateVector} from 'apache-arrow';
import {VECTOR_TYPES} from './constants';

export function encodeArrowSync(data, options) {
  const vectors = [];
  const arrayNames = [];
  for (const arrayData of data) {
    arrayNames.push(arrayData.name);
    const arrayVector = createVector(arrayData.array, arrayData.type);
    vectors.push(arrayVector);
  }
  const table = Table.new(vectors, arrayNames);
  const arrowBuffer = table.serialize();
  return arrowBuffer;
}

/**
 * Create Arrow Vector from given data and vector type
 * @param array {import('../types').AnyArrayType} - columns data
 * @param type {number} - the writer options
 * @return a vector of one of vector's types defined in the Apache Arrow library
 */
function createVector(array, type) {
  switch (type) {
    case VECTOR_TYPES.DATE:
      return DateVector.from(array);
    case VECTOR_TYPES.FLOAT:
    default:
      return FloatVector.from(array);
  }
}
