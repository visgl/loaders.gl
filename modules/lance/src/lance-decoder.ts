// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LanceFileColumnMetadata, LanceFilePageMetadata} from './lance-file';

/** Fixed-width primitive logical types supported by the first Lance decoder tranche. */
export type LanceFlatPrimitiveType =
  | 'int8'
  | 'uint8'
  | 'int16'
  | 'uint16'
  | 'int32'
  | 'uint32'
  | 'int64'
  | 'uint64'
  | 'float'
  | 'double';

/** Typed-array result returned by the flat primitive decoder. */
export type LanceFlatPrimitiveArray =
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | BigInt64Array
  | BigUint64Array
  | Float32Array
  | Float64Array;

/** Error raised when a page is outside the supported flat primitive subset. */
export class LanceFlatPageUnsupportedError extends Error {
  /** Creates a descriptive unsupported-page error. */
  constructor(message: string) {
    super(message);
    this.name = 'LanceFlatPageUnsupportedError';
  }
}

const PRIMITIVE_WIDTHS: Record<LanceFlatPrimitiveType, number> = {
  int8: 1,
  uint8: 1,
  int16: 2,
  uint16: 2,
  int32: 4,
  uint32: 4,
  int64: 8,
  uint64: 8,
  float: 4,
  double: 8
};

function createArray(type: LanceFlatPrimitiveType, length: number): LanceFlatPrimitiveArray {
  switch (type) {
    case 'int8':
      return new Int8Array(length);
    case 'uint8':
      return new Uint8Array(length);
    case 'int16':
      return new Int16Array(length);
    case 'uint16':
      return new Uint16Array(length);
    case 'int32':
      return new Int32Array(length);
    case 'uint32':
      return new Uint32Array(length);
    case 'int64':
      return new BigInt64Array(length);
    case 'uint64':
      return new BigUint64Array(length);
    case 'float':
      return new Float32Array(length);
    case 'double':
      return new Float64Array(length);
  }
}

/** Decodes a non-nullable flat Lance page into a typed array. */
export function decodeLanceFlatPage(
  arrayBuffer: ArrayBuffer | ArrayBufferView,
  page: LanceFilePageMetadata,
  type: LanceFlatPrimitiveType
): LanceFlatPrimitiveArray {
  if (page.bufferOffsets.length !== 1 || page.bufferSizes.length !== 1) {
    throw new LanceFlatPageUnsupportedError(
      'Flat Lance pages must contain exactly one value buffer'
    );
  }
  if (page.length > Number.MAX_SAFE_INTEGER) {
    throw new LanceFlatPageUnsupportedError('Lance page length exceeds JavaScript limits');
  }

  const bytes =
    arrayBuffer instanceof ArrayBuffer
      ? new Uint8Array(arrayBuffer)
      : new Uint8Array(arrayBuffer.buffer, arrayBuffer.byteOffset, arrayBuffer.byteLength);
  const offset = page.bufferOffsets[0];
  const size = page.bufferSizes[0];
  const width = PRIMITIVE_WIDTHS[type];
  if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(size) || offset < 0 || size < 0) {
    throw new LanceFlatPageUnsupportedError(
      'Flat Lance page contains an invalid value buffer range'
    );
  }
  if (offset + size > bytes.byteLength || size !== page.length * width) {
    throw new LanceFlatPageUnsupportedError(
      'Flat Lance value buffer size does not match its page type'
    );
  }

  const result = createArray(type, page.length);
  const view = new DataView(bytes.buffer, bytes.byteOffset + offset, size);
  for (let index = 0; index < page.length; index++) {
    switch (type) {
      case 'int8':
        result[index] = view.getInt8(index);
        break;
      case 'uint8':
        result[index] = view.getUint8(index);
        break;
      case 'int16':
        result[index] = view.getInt16(index * width, true);
        break;
      case 'uint16':
        result[index] = view.getUint16(index * width, true);
        break;
      case 'int32':
        result[index] = view.getInt32(index * width, true);
        break;
      case 'uint32':
        result[index] = view.getUint32(index * width, true);
        break;
      case 'int64':
        result[index] = view.getBigInt64(index * width, true);
        break;
      case 'uint64':
        result[index] = view.getBigUint64(index * width, true);
        break;
      case 'float':
        result[index] = view.getFloat32(index * width, true);
        break;
      case 'double':
        result[index] = view.getFloat64(index * width, true);
        break;
    }
  }
  return result;
}

/** Decodes and concatenates all flat pages belonging to one Lance column. */
export function decodeLanceFlatColumn(
  arrayBuffer: ArrayBuffer | ArrayBufferView,
  column: LanceFileColumnMetadata,
  type: LanceFlatPrimitiveType
): LanceFlatPrimitiveArray {
  const pages = [...column.pages].sort(
    (firstPage, secondPage) => firstPage.priority - secondPage.priority
  );
  let totalLength = 0;
  let previousPriority = -1;
  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const page = pages[pageIndex];
    if (!Number.isSafeInteger(page.length) || page.length < 0) {
      throw new LanceFlatPageUnsupportedError('Lance flat column contains an invalid page length');
    }
    if (pageIndex > 0 && page.priority <= previousPriority) {
      throw new LanceFlatPageUnsupportedError('Lance flat column pages have invalid priorities');
    }
    previousPriority = page.priority;
    totalLength += page.length;
    if (!Number.isSafeInteger(totalLength)) {
      throw new LanceFlatPageUnsupportedError('Lance flat column is too large for JavaScript');
    }
  }

  const result = createArray(type, totalLength);
  let targetOffset = 0;
  for (const page of pages) {
    const values = decodeLanceFlatPage(arrayBuffer, page, type);
    if (type === 'int64' || type === 'uint64') {
      (result as BigInt64Array).set(values as BigInt64Array, targetOffset);
    } else {
      (result as Int8Array).set(values as Int8Array, targetOffset);
    }
    targetOffset += values.length;
  }
  return result;
}
