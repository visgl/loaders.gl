/**
 * Encodes I3S string attributes as little-endian counts followed by UTF-8 strings.
 * Each string's byte count includes its trailing null byte. Values retain the
 * converter's existing JavaScript string coercion, including null and undefined.
 */
export function encodeStringAttribute(values: readonly unknown[]): ArrayBuffer {
  const textEncoder = new TextEncoder();
  const encodedValues = Array.from(values, value => textEncoder.encode(`${String(value)}\0`));
  const stringByteLength = encodedValues.reduce((total, value) => total + value.byteLength, 0);
  const headerByteLength = (2 + values.length) * Uint32Array.BYTES_PER_ELEMENT;
  const output = new Uint8Array(headerByteLength + stringByteLength);
  const header = new DataView(output.buffer);
  header.setUint32(0, values.length, true);
  header.setUint32(4, stringByteLength, true);

  let byteOffset = headerByteLength;
  for (const [index, encodedValue] of encodedValues.entries()) {
    header.setUint32(8 + index * Uint32Array.BYTES_PER_ELEMENT, encodedValue.byteLength, true);
    output.set(encodedValue, byteOffset);
    byteOffset += encodedValue.byteLength;
  }
  return output.buffer;
}
