// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// import type {TextureLevel} from '@loaders.gl/schema';
import {TypedArray} from '@math.gl/types';
// import {TypedArrayConstructor} from "@math.gl/types";

// TODO move to math.gl
type TypedArrayConstructor =
  | typeof Int8Array
  | typeof Uint8Array
  | typeof Int16Array
  | typeof Uint16Array
  | typeof Int32Array
  | typeof Uint32Array
  | typeof Float32Array
  | typeof Float64Array;

const a = new Uint32Array([0x12345678]);
const b = new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
const isLittleEndian = !(b[0] === 0x12);

const LITTLE_ENDIAN_OS = isLittleEndian;

/** One numpy "tile" */
export type NPYTile = {
  /** tile header */
  header: NumpyHeader;
  /** data in tile */
  data: TypedArray;
};

type NumpyHeader = {
  descr: string;
  shape: number[];
};

/**
 * The basic string format consists of 3 characters:
 * 1. a character describing the byteorder of the data (<: little-endian, >: big-endian, |: not-relevant)
 * 2. a character code giving the basic type of the array
 * 3. an integer providing the number of bytes the type uses.
 * https://numpy.org/doc/stable/reference/arrays.interface.html
 *
 * Here I only include the second and third characters, and check endianness separately
 */
const DTYPES: Record<string, TypedArrayConstructor> = {
  u1: Uint8Array,
  i1: Int8Array,
  u2: Uint16Array,
  i2: Int16Array,
  u4: Uint32Array,
  i4: Int32Array,
  f4: Float32Array,
  f8: Float64Array
};

export function parseNPY(arrayBuffer: ArrayBuffer, options?: {}): NPYTile {
  const view = new DataView(arrayBuffer);
  const {header, headerEndOffset} = parseHeader(view);

  const numpyType = header.descr;
  const ArrayType = DTYPES[numpyType.slice(1, 3)];
  if (!ArrayType) {
    throw new Error(`Unimplemented type ${numpyType}`);
  }

  const nArrayElements = header.shape?.reduce((a: number, b: number): number => a * b);
  const arrayByteLength = nArrayElements * ArrayType.BYTES_PER_ELEMENT;

  if (arrayBuffer.byteLength < headerEndOffset + arrayByteLength) {
    throw new Error('Buffer overflow');
  }
  const data = new ArrayType(arrayBuffer.slice(headerEndOffset, headerEndOffset + arrayByteLength));

  // Swap endianness if needed
  if ((numpyType[0] === '>' && LITTLE_ENDIAN_OS) || (numpyType[0] === '<' && !LITTLE_ENDIAN_OS)) {
    throw new Error('Incorrect endianness');
  }

  return {
    data,
    header
  };
}

/**
 * Parse NPY header
 *
 * @param  view
 * @return
 */
function parseHeader(view: DataView): {header: NumpyHeader; headerEndOffset: number} {
  const majorVersion = view.getUint8(6);
  // const minorVersion = view.getUint8(7);

  let offset = 8;
  let headerLength: number;
  if (majorVersion >= 2) {
    headerLength = view.getUint32(offset, true);
    offset += 4;
  } else {
    headerLength = view.getUint16(offset, true);
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
