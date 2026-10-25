// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Common HDF5 filter identifiers. */
export type HDF5Filter = {
  /** Filter identifier. */
  id: number;
  /** Optional and configuration flags. */
  flags: number;
  /** Filter-specific parameters. */
  clientData: readonly number[];
};
function requireFilter(value: unknown, message: string): asserts value {
  if (!value) throw new Error('HDF5: ' + message);
}
function uint16(bytes: Uint8Array, offset: number): number {
  requireFilter(offset + 2 <= bytes.length, 'truncated filter metadata');
  return bytes[offset] | (bytes[offset + 1] << 8);
}
/** Decode a bounded HDF5 v1 or v2 filter pipeline message. */
export function parseHDF5FilterPipeline(bytes: Uint8Array): HDF5Filter[] {
  requireFilter(bytes.length >= 2, 'truncated filter pipeline');
  const version = bytes[0],
    count = bytes[1];
  requireFilter(version === 1 || version === 2, 'unsupported filter pipeline version');
  requireFilter(count <= 32, 'too many filters');
  let cursor = version === 1 ? 8 : 2;
  const filters: HDF5Filter[] = [];
  for (let i = 0; i < count; i++) {
    requireFilter(cursor + (version === 1 ? 8 : 6) <= bytes.length, 'truncated filter header');
    const id = uint16(bytes, cursor);
    cursor += 2;
    const nameLength = version === 1 || id >= 256 ? uint16(bytes, cursor) : 0;
    if (version === 1 || id >= 256) cursor += 2;
    const flags = uint16(bytes, cursor);
    cursor += 2;
    const countValues = uint16(bytes, cursor);
    cursor += 2;
    requireFilter(countValues <= 64, 'oversized filter parameters');
    cursor += nameLength;
    if (version === 1 && cursor % 8) cursor += 8 - (cursor % 8);
    const clientData: number[] = [];
    for (let j = 0; j < countValues; j++) {
      requireFilter(cursor + 4 <= bytes.length, 'truncated filter parameter');
      clientData.push(
        (bytes[cursor] |
          (bytes[cursor + 1] << 8) |
          (bytes[cursor + 2] << 16) |
          (bytes[cursor + 3] << 24)) >>>
          0
      );
      cursor += 4;
    }
    if (version === 1 && countValues % 2) cursor += 4;
    filters.push({id, flags, clientData});
  }
  return filters;
}
/** Reverse byte shuffling for fixed-width HDF5 elements. */
export function unshuffleHDF5(bytes: Uint8Array, elementSize: number): Uint8Array {
  requireFilter(
    Number.isSafeInteger(elementSize) && elementSize > 0,
    'invalid shuffle element size'
  );
  const count = Math.floor(bytes.length / elementSize);
  const output = new Uint8Array(bytes.length);
  for (let byte = 0; byte < elementSize; byte++) {
    for (let i = 0; i < count; i++) output[i * elementSize + byte] = bytes[byte * count + i];
  }
  output.set(bytes.subarray(count * elementSize), count * elementSize);
  return output;
}
/** Validate and remove an HDF5 Fletcher32 trailer. */
export function verifyHDF5Fletcher32(bytes: Uint8Array): Uint8Array {
  requireFilter(bytes.length >= 4, 'truncated Fletcher32 checksum');
  const end = bytes.length - 4;
  let sum1 = 0xffff,
    sum2 = 0xffff;
  for (let i = 0; i < end; i += 2) {
    const word = bytes[i] | (i + 1 < end ? bytes[i + 1] << 8 : 0);
    sum1 = (sum1 + word) % 65535;
    sum2 = (sum2 + sum1) % 65535;
  }
  const expected = ((sum2 << 16) | sum1) >>> 0;
  const stored =
    ((bytes[end] << 24) | (bytes[end + 1] << 16) | (bytes[end + 2] << 8) | bytes[end + 3]) >>> 0;
  requireFilter(expected === stored, 'Fletcher32 checksum mismatch');
  return bytes.subarray(0, end);
}
/** Reverse a chunk's filter pipeline; caller supplies decompression for deflate. */
export async function decodeHDF5Filters(
  encoded: Uint8Array,
  filters: readonly HDF5Filter[],
  mask = 0,
  inflate?: (bytes: Uint8Array) => Promise<Uint8Array>
): Promise<Uint8Array> {
  let result = encoded;
  for (let i = filters.length - 1; i >= 0; i--) {
    if (mask & (1 << i)) continue;
    const filter = filters[i];
    if (filter.id === 1) {
      requireFilter(inflate, 'deflate decoder not configured');
      result = await inflate(result);
    } else if (filter.id === 2) {
      result = unshuffleHDF5(result, filter.clientData[0]);
    } else if (filter.id === 3) {
      result = verifyHDF5Fletcher32(result);
    } else {
      throw new Error('HDF5: unsupported filter ' + filter.id);
    }
  }
  return result;
}
