// loaders.gl, MIT license

/**
 * Simple helper to decode and encode "hex encoded" binary buffers
 * without first converting to string.
 */
export class HexEncoder {
  /** Get length in bytes required to store encoded data */
  getEncodedLength(array: Uint8Array): number {
    return array.byteLength * 2;
  }

  /** Get length in bytes required to store decoded data */
  getDecodedLength(array: Uint8Array): number {
    return Math.ceil(array.byteLength / 2);
  }

  /** Decode hexadecimal */
  decode(array: Uint8Array, result: Uint8Array): Uint8Array {
    for (let i = 0; i < array.byteLength / 2; ++i) {
      const halfByte1 = hexDecode(array[i]);
      const halfByte2 = hexDecode(array[i + 1]);
      result[i] = halfByte1 * 16 + halfByte2;
    }
    // Check if final half byte (is that legal?)
    // if (array.byteLength % 2) {
    //   const halfByte1 = hexDecode(array[i]);
    // }
    return result;
  }

  /** Encode hexadecimal */
  encode(array: Uint8Array, result: Uint8Array): Uint8Array {
    for (let i = 0; i < array.byteLength; ++i) {
      const byte = array[i];
      result[i * 2] = hexEncode(byte & 0x0f);
      result[i * 2 + 1] = hexEncode(byte & 0xf0);
    }
    return result;
  }
}

function hexEncode(value: number): number {
  if (value < 10) {
    return value + 48; // ASCII of 0
  }
  return value - 10 + 65; // ASCII of capital A
}

function hexDecode(value: number): number {
  if (value >= 65) {
    return value - 65 + 10; // ASCII of A
  }
  if (value >= 97) {
    return value - 97 + 10; // ASCII of a
  }
  return value - 48; // ASCII of 0
}
