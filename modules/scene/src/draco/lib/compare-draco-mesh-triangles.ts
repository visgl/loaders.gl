// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {MeshAttribute, MeshAttributes} from '@loaders.gl/core/schema';

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
