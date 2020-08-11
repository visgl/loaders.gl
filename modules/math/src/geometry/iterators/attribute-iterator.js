/** @typedef {import('./attribute-iterator')} types */

/** @type {types['makeAttributeIterator']} */
export function* makeAttributeIterator({values, size}) {
  const ArrayType = values.constructor;
  const element = new ArrayType(size);
  for (let i = 0; i < values.length; i += size) {
    for (let j = 0; j < size; j++) {
      element[j] = element[i + j];
    }
    yield element;
  }
}
