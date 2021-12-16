/**
 * Convert a hex string to an ArrayBuffer.
 *
 * @param hexString - hex representation of bytes
 * @return Parsed bytes
 */
export default function hexStringToArrayBuffer(hexString: string): ArrayBuffer {
  // remove the leading 0x
  hexString = hexString.replace(/^0x/, '');

  // split the string into pairs of octets
  const pairs = hexString.match(/[\dA-F]{2}/gi);

  // convert the octets to integers
  const integers = pairs ? pairs.map((s) => parseInt(s, 16)) : [];
  return new Uint8Array(integers).buffer;
}
