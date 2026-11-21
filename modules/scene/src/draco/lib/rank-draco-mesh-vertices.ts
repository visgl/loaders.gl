// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {MeshAttribute} from '@loaders.gl/core/schema';

/** Ranks exact vertex tuples across both meshes and bounds the work spent on hash collisions. */
export function rankDracoMeshVertices(
  source: MeshAttribute[],
  sourceCount: number,
  decoded: MeshAttribute[],
  decodedCount: number
): [Uint32Array, Uint32Array] | null {
  const sourceRanks = new Uint32Array(sourceCount);
  const decodedRanks = new Uint32Array(decodedCount);
  let capacity = 1;
  while (capacity < sourceCount * 2) capacity *= 2;
  const entries = new Uint32Array(capacity);
  const hashes = new Uint32Array(capacity);
  const mask = capacity - 1;
  const bits = new Uint32Array(2);
  const scalar = new Float64Array(bits.buffer);

  /** Hashes a tuple and finds its source representative using exact numeric equality. */
  function findSlot(attributes: MeshAttribute[], vertex: number, insert: boolean): number {
    let hash = 2166136261;
    for (const {size, value} of attributes) {
      const start = vertex * size;
      for (let component = 0; component < size; component++) {
        const number = value[start + component];
        scalar[0] = number === 0 ? 0 : number;
        hash = Math.imul(hash ^ bits[0], 16777619);
        hash = Math.imul(hash ^ bits[1], 16777619);
      }
    }
    hash = (hash ^ (hash >>> 16)) >>> 0;
    let slot = hash & mask;
    for (let probe = 0; probe < 32; probe++) {
      const representative = entries[slot];
      if (!representative) {
        if (insert) {
          entries[slot] = vertex + 1;
          hashes[slot] = hash;
        }
        return slot;
      }
      if (
        hashes[slot] === hash &&
        equalVertexTuples(source, representative - 1, attributes, vertex)
      ) {
        return slot;
      }
      slot = (slot + 1) & mask;
    }
    return -1;
  }

  for (let vertex = 0; vertex < sourceCount; vertex++) {
    const slot = findSlot(source, vertex, true);
    if (slot < 0) return null;
    sourceRanks[vertex] = entries[slot];
  }
  for (let vertex = 0; vertex < decodedCount; vertex++) {
    const slot = findSlot(decoded, vertex, false);
    if (slot < 0) return null;
    // Rank zero marks tuples absent from the source, including unused decoded vertices.
    decodedRanks[vertex] = entries[slot];
  }
  return [sourceRanks, decodedRanks];
}

/** Tests equality of two packed finite vertex tuples, including exact attribute values. */
function equalVertexTuples(
  source: MeshAttribute[],
  sourceVertex: number,
  decoded: MeshAttribute[],
  decodedVertex: number
): boolean {
  for (let attribute = 0; attribute < source.length; attribute++) {
    const {size, value} = source[attribute];
    const decodedValues = decoded[attribute].value;
    const sourceStart = sourceVertex * size;
    const decodedStart = decodedVertex * size;
    for (let component = 0; component < size; component++) {
      if (value[sourceStart + component] !== decodedValues[decodedStart + component]) return false;
    }
  }
  return true;
}
