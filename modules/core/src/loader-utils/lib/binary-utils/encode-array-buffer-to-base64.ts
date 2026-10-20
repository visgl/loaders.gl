// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Encode binary bytes without exceeding argument limits or inserting padding between chunks. */
export function encodeArrayBufferToBase64(arrayBuffer: ArrayBuffer): string {
  const bytes = new Uint8Array(arrayBuffer);
  const encodedChunks: string[] = [];
  // Full chunks contain a multiple of three bytes, so only the final chunk can need padding.
  const chunkByteLength = 3 * 4096;
  for (let byteOffset = 0; byteOffset < bytes.length; byteOffset += chunkByteLength) {
    encodedChunks.push(
      btoa(String.fromCharCode(...bytes.subarray(byteOffset, byteOffset + chunkByteLength)))
    );
  }
  return encodedChunks.join('');
}
