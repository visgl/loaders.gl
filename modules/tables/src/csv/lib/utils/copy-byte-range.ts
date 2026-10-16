// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

const SHORT_COPY_MAX_LENGTH = 32;

/**
 * Copies a byte range using the faster Chromium strategy for its length.
 *
 * Callers are responsible for supplying valid source and target ranges.
 */
export function copyByteRange(
  source: Uint8Array,
  start: number,
  end: number,
  target: Uint8Array,
  targetStart: number
): number {
  const byteLength = end - start;
  if (byteLength <= SHORT_COPY_MAX_LENGTH) {
    for (let byteIndex = start; byteIndex < end; byteIndex++) {
      target[targetStart] = source[byteIndex];
      targetStart++;
    }
    return targetStart;
  }
  target.set(source.subarray(start, end), targetStart);
  return targetStart + byteLength;
}
