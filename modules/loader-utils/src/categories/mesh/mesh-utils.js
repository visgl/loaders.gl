export function getMeshSize(attributes) {
  let size = 0;
  for (const attributeName in attributes) {
    const attribute = attributes[attributeName];
    if (ArrayBuffer.isView(attribute)) {
      size += attribute.length * attribute.BYTES_PER_ELEMENT;
    }
  }
  return size;
}
