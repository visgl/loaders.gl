/* globals TextDecoder */

function systemIsLittleEndian() {
  const a = new Uint32Array([0x12345678]);
  const b = new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
  return !(b[0] === 0x12);
}

const LITTLE_ENDIAN_OS = systemIsLittleEndian();

// The basic string format consists of 3 characters:
// 1. a character describing the byteorder of the data (<: little-endian, >: big-endian, |: not-relevant)
// 2. a character code giving the basic type of the array
// 3. an integer providing the number of bytes the type uses.
// https://numpy.org/doc/stable/reference/arrays.interface.html
//
// Here I only include the second and third characters, and check endianness
// separately
const DTYPES = {
  u1: Uint8Array,
  i1: Int8Array,
  u2: Uint16Array,
  i2: Int16Array,
  u4: Uint32Array,
  i4: Int32Array,
  f4: Float32Array,
  f8: Float64Array
};

export function parseNPY(arrayBuffer, options) {
  if (!arrayBuffer) {
    return null;
  }

  const view = new DataView(arrayBuffer);
  const {header, headerEndOffset} = parseHeader(view);

  const numpyType = header.descr;
  const ArrayType = DTYPES[numpyType.slice(1, 3)];
  if (!ArrayType) {
    // eslint-disable-next-line no-console, no-undef
    console.warn(`Decoding of npy dtype not implemented: ${numpyType}`);
    return null;
  }

  const nArrayElements = header.shape.reduce((a, b) => a * b);
  const arrayByteLength = nArrayElements * ArrayType.BYTES_PER_ELEMENT;

  const data = new ArrayType(arrayBuffer.slice(headerEndOffset, headerEndOffset + arrayByteLength));

  // Swap endianness if needed
  if ((numpyType[0] === '>' && LITTLE_ENDIAN_OS) || (numpyType[0] === '<' && !LITTLE_ENDIAN_OS)) {
    // eslint-disable-next-line no-console, no-undef
    console.warn('Data is wrong endianness, byte swapping not yet implemented.');
  }

  return {
    data,
    header
  };
}

/**
 * Parse NPY header
 *
 * @param  {DataView} view
 * @return {Object}
 */
function parseHeader(view) {
  const majorVersion = view.getUint8(6);
  // const minorVersion = view.getUint8(7);

  let offset = 8;
  let headerLength;
  if (majorVersion >= 2) {
    headerLength = view.getUint32(8, true);
    offset += 4;
  } else {
    headerLength = view.getUint16(8, true);
    offset += 2;
  }

  const encoding = majorVersion <= 2 ? 'latin1' : 'utf-8';
  const decoder = new TextDecoder(encoding);
  const headerArray = new Uint8Array(view.buffer, offset, headerLength);
  const headerText = decoder.decode(headerArray);
  offset += headerLength;

  const header = JSON.parse(
    headerText
      .replace(/'/g, '"')
      .replace('False', 'false')
      .replace('(', '[')
      .replace(/,*\),*/g, ']')
  );

  return {header, headerEndOffset: offset};
}
