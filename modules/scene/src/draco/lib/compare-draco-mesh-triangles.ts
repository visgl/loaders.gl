// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {MeshAttribute, MeshAttributes} from '@loaders.gl/core/schema';
import {rankDracoMeshVertices} from './rank-draco-mesh-vertices';

/**
 * Compares the named packed, finite vertex attributes at valid triangle indices.
 * Face order and cyclic corner rotation are ignored. Winding and multiplicity are preserved.
 */
export function hasSameDracoMeshTriangles(
  source: MeshAttributes,
  sourceIndices: ArrayLike<number>,
  decoded: MeshAttributes,
  decodedIndices: ArrayLike<number>,
  names: readonly string[]
): boolean {
  if (
    sourceIndices.length !== decodedIndices.length ||
    sourceIndices.length % 3 ||
    names.some(name => source[name]?.size !== decoded[name]?.size)
  )
    return false;

  const sourceAttributes = names.filter(name => source[name]).map(name => source[name]);
  const decodedAttributes = names.filter(name => decoded[name]).map(name => decoded[name]);
  const ranks = getVertexRanks(sourceAttributes, sourceIndices.length / 3, decodedAttributes);
  if (ranks) {
    return haveSameRankedTriangles(ranks[0], sourceIndices, ranks[1], decodedIndices);
  }
  const first = getTriangleOrder(sourceAttributes, sourceIndices);
  const second = getTriangleOrder(decodedAttributes, decodedIndices);
  for (let triangle = 0; triangle < first.length; triangle++) {
    if (
      compareTriangles(
        sourceAttributes,
        sourceIndices,
        first[triangle],
        decodedAttributes,
        decodedIndices,
        second[triangle]
      )
    )
      return false;
  }
  return true;
}

/** Stores one corner offset per face, then sorts by the canonical oriented triangle tuple. */
function getTriangleOrder(attributes: MeshAttribute[], indices: ArrayLike<number>): Uint32Array {
  const order = new Uint32Array(indices.length / 3);
  for (let start = 0; start < indices.length; start += 3) {
    let canonical = start;
    for (let offset = start + 1; offset < start + 3; offset++) {
      if (compareTriangles(attributes, indices, offset, attributes, indices, canonical) < 0)
        canonical = offset;
    }
    order[start / 3] = canonical;
  }
  return order.sort((left, right) =>
    compareTriangles(attributes, indices, left, attributes, indices, right)
  );
}

/** Orders oriented faces by successive vertex attribute tuples from each selected corner. */
function compareTriangles(
  leftAttributes: MeshAttribute[],
  leftIndices: ArrayLike<number>,
  leftOffset: number,
  rightAttributes: MeshAttribute[],
  rightIndices: ArrayLike<number>,
  rightOffset: number
): number {
  const leftCorner = leftOffset % 3;
  const rightCorner = rightOffset % 3;
  for (let corner = 0; corner < 3; corner++) {
    const leftVertex = leftIndices[leftOffset - leftCorner + ((leftCorner + corner) % 3)];
    const rightVertex = rightIndices[rightOffset - rightCorner + ((rightCorner + corner) % 3)];
    for (let attribute = 0; attribute < leftAttributes.length; attribute++) {
      const left = leftAttributes[attribute];
      const right = rightAttributes[attribute];
      const leftStart = leftVertex * left.size;
      const rightStart = rightVertex * left.size;
      for (let component = 0; component < left.size; component++) {
        const leftValue = left.value[leftStart + component];
        const rightValue = right.value[rightStart + component];
        if (leftValue !== rightValue) return leftValue < rightValue ? -1 : 1;
      }
    }
  }
  return 0;
}

/** Ranks only large meshes with a bounded number of vertices relative to the face count. */
function getVertexRanks(
  source: MeshAttribute[],
  triangleCount: number,
  decoded: MeshAttribute[]
): [Uint32Array, Uint32Array] | null {
  // Bound the extra Float64 face-order buffers to 16 MiB total.
  if (triangleCount < 65_536 || triangleCount > 1_048_576 || !source.length) return null;
  const sourceCount = source[0].value.length / source[0].size;
  const decodedCount = decoded[0].value.length / decoded[0].size;
  // Three ranks in this radix must fit exactly in a JavaScript safe integer.
  if ((sourceCount + 1) ** 3 > 2 ** 53 || sourceCount + decodedCount > triangleCount * 3) {
    return null;
  }
  if (
    !Number.isInteger(sourceCount) ||
    !Number.isInteger(decodedCount) ||
    source.some(attribute => attribute.value.length !== sourceCount * attribute.size) ||
    decoded.some(attribute => attribute.value.length !== decodedCount * attribute.size)
  )
    return null;
  return rankDracoMeshVertices(source, sourceCount, decoded, decodedCount);
}

/** Compares packed, exactly representable rank triples with a numeric typed-array sort. */
function haveSameRankedTriangles(
  sourceRanks: Uint32Array,
  sourceIndices: ArrayLike<number>,
  decodedRanks: Uint32Array,
  decodedIndices: ArrayLike<number>
): boolean {
  const radix = sourceRanks.length + 1;
  const first = sortRankedTriangles(sourceRanks, sourceIndices, radix);
  const second = sortRankedTriangles(decodedRanks, decodedIndices, radix);
  return Boolean(first && second && first.every((triangle, index) => triangle === second[index]));
}

/** Packs the smallest cyclic rotation of each oriented rank triple into one exact integer. */
function sortRankedTriangles(
  ranks: Uint32Array,
  indices: ArrayLike<number>,
  radix: number
): Float64Array | null {
  const triangles = new Float64Array(indices.length / 3);
  const radixSquared = radix * radix;
  for (let index = 0; index < indices.length; index += 3) {
    const first = ranks[indices[index]];
    const second = ranks[indices[index + 1]];
    const third = ranks[indices[index + 2]];
    if (!first || !second || !third) return null;
    triangles[index / 3] = Math.min(
      first * radixSquared + second * radix + third,
      second * radixSquared + third * radix + first,
      third * radixSquared + first * radix + second
    );
  }
  return triangles.sort();
}
