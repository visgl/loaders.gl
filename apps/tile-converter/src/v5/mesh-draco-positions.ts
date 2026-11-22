// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Checks decoded xyz tuples against validated finite Float32 source positions. */
export function hasSameDracoPositions(source: Float32Array, decoded: Float32Array): boolean {
  const sourceWords = new Uint32Array(source.buffer, source.byteOffset, source.length);
  const decodedWords = new Uint32Array(decoded.buffer, decoded.byteOffset, decoded.length);
  // Keep the hash table at or below 8 MiB. The sorted fallback uses one offset per source vertex.
  if (source.length > 3 * 1_048_576) return compareSortedPositions(sourceWords, decodedWords);
  let capacity = 1;
  while (capacity * 3 < source.length * 2) capacity *= 2;
  const entries = new Uint32Array(capacity);
  const mask = capacity - 1;
  for (let offset = 0; offset < sourceWords.length; offset += 3) {
    const slot = findPosition(sourceWords, offset, sourceWords, entries, mask);
    if (slot < 0) return compareSortedPositions(sourceWords, decodedWords);
    entries[slot] = offset + 1;
  }
  for (let offset = 0; offset < decodedWords.length; offset += 3) {
    const slot = findPosition(decodedWords, offset, sourceWords, entries, mask);
    if (slot < 0) return compareSortedPositions(sourceWords, decodedWords);
    if (!entries[slot]) return false;
  }
  return true;
}

/** Finds a matching or vacant slot, with bounded work even when hashes collide. */
function findPosition(
  positions: Uint32Array,
  offset: number,
  source: Uint32Array,
  entries: Uint32Array,
  mask: number
): number {
  const x = normalizeZero(positions[offset]);
  const y = normalizeZero(positions[offset + 1]);
  const z = normalizeZero(positions[offset + 2]);
  const hash = Math.imul(x, 0x85ebca6b) ^ Math.imul(y, 0xc2b2ae35) ^ Math.imul(z, 0x27d4eb2f);
  let slot = (hash ^ (hash >>> 16)) & mask;
  for (let probe = 0; probe < 64; probe++) {
    const entry = entries[slot];
    if (
      !entry ||
      (x === normalizeZero(source[entry - 1]) &&
        y === normalizeZero(source[entry]) &&
        z === normalizeZero(source[entry + 1]))
    )
      return slot;
    slot = (slot + 1) & mask;
  }
  return -1;
}

/** Treats both Float32 encodings of zero as the same coordinate. */
function normalizeZero(word: number): number {
  return word === 0x80000000 ? 0 : word;
}

/** Checks exact membership by binary search when the hash table would be large or crowded. */
function compareSortedPositions(source: Uint32Array, decoded: Uint32Array): boolean {
  const offsets = Uint32Array.from({length: source.length / 3}, (_, vertex) => vertex * 3);
  offsets.sort((left, right) => comparePositionWords(source, left, source, right));
  for (let offset = 0; offset < decoded.length; offset += 3) {
    let start = 0;
    let end = offsets.length;
    while (start < end) {
      const middle = start + Math.floor((end - start) / 2);
      if (comparePositionWords(source, offsets[middle], decoded, offset) < 0) {
        start = middle + 1;
      } else {
        end = middle;
      }
    }
    if (start === offsets.length || comparePositionWords(source, offsets[start], decoded, offset)) {
      return false;
    }
  }
  return true;
}

/** Orders packed xyz words consistently for sorting and lookup. */
function comparePositionWords(
  source: Uint32Array,
  sourceOffset: number,
  decoded: Uint32Array,
  decodedOffset: number
): number {
  return (
    normalizeZero(source[sourceOffset]) - normalizeZero(decoded[decodedOffset]) ||
    normalizeZero(source[sourceOffset + 1]) - normalizeZero(decoded[decodedOffset + 1]) ||
    normalizeZero(source[sourceOffset + 2]) - normalizeZero(decoded[decodedOffset + 2])
  );
}
