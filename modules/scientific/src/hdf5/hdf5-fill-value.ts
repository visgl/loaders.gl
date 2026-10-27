// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {decodeHDF5Primitive, type HDF5Primitive} from './hdf5-dataset-messages';

/** Parse HDF5 fill-value message v2/v3 for fixed-width numeric datasets. */
export function parseHDF5FillValue(
  payload: Uint8Array,
  type: HDF5Primitive
): number | bigint | undefined {
  if (payload.length < 2) throw new Error('HDF5: truncated fill-value message');
  const version = payload[0];
  let offset: number, length: number;
  if (version === 3) {
    const flags = payload[1];
    // Undefined fill value: HDF5 defaults to zero for numeric types.
    if (!(flags & 0x20)) return undefined;
    if (payload.length < 6) throw new Error('HDF5: truncated fill-value length');
    length = new DataView(payload.buffer, payload.byteOffset).getUint32(2, true);
    offset = 6;
  } else if (version === 2) {
    if (payload.length < 8) throw new Error('HDF5: truncated fill-value message');
    if (payload[3] === 0) return undefined;
    length = new DataView(payload.buffer, payload.byteOffset).getUint32(4, true);
    offset = 8;
  } else {
    throw new Error('HDF5: unsupported fill-value version ' + version);
  }
  if (length !== type.size || offset + length !== payload.length) {
    throw new Error('HDF5: invalid numeric fill-value size');
  }
  const decoded = decodeHDF5Primitive(payload.subarray(offset), type);
  return (decoded as unknown as {readonly [index: number]: number | bigint})[0];
}
