export function getMeshSize(attributes) {
  let size = 0;
  for (const attributeName in attributes) {
    const attribute = attributes[attributeName];
    if (ArrayBuffer.isView(attribute)) {
      // @ts-ignore DataView doesn't have BYTES_PER_ELEMENT
      size += attribute.byteLength * attribute.BYTES_PER_ELEMENT;
    }
  }
  return size;
}
