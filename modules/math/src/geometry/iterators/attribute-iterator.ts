/**
 * Iterates over a single attribute
 * NOTE: For performance, re-yields the same modified element
 * @param param0
 */
export function* makeAttributeIterator(values: any, size: number): Iterable<any> {
  const ArrayType = values.constructor;
  const element = new ArrayType(size);
  for (let i = 0; i < values.length; i += size) {
    for (let j = 0; j < size; j++) {
      element[j] = element[i + j];
    }
    yield element;
  }
}
