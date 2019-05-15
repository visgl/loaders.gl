// Iterates over a single attribute
// NOTE: creates and re-yields a single element

export default function* attributeIterator({values, size}) {
  const ArrayType = values.constructor;
  const element = new ArrayType(size);
  for (let i = 0; i < values.length; i += size) {
    for (let j = 0; j < size; j++) {
      element[j] = element[i + j];
    }
    yield element;
  }
}
