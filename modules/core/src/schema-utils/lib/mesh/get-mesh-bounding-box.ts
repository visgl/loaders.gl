// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {MeshAttributes} from '@loaders.gl/core/schema';

/**
 * Holds an axis aligned bounding box
 * TODO - make sure AxisAlignedBoundingBox in math.gl/culling understands this format (or change this format)
 */
type BoundingBox = [[number, number, number], [number, number, number]];

/**
 * Get the (axis aligned) bounding box of a mesh
 * @param attributes
 * @returns array of two vectors representing the axis aligned bounding box
 */
// eslint-disable-next-line complexity
export function getMeshBoundingBox(attributes: MeshAttributes | null): BoundingBox | null {
  const positionAttribute = attributes?.POSITION;
  if (!positionAttribute || !('value' in positionAttribute) || !positionAttribute.value.length) {
    return null;
  }

  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  const positions = positionAttribute.value;
  const len = positions.length;

  for (let i = 0; i < len; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];

    minX = x < minX ? x : minX;
    minY = y < minY ? y : minY;
    minZ = z < minZ ? z : minZ;

    maxX = x > maxX ? x : maxX;
    maxY = y > maxY ? y : maxY;
    maxZ = z > maxZ ? z : maxZ;
  }
  return [
    [minX, minY, minZ],
    [maxX, maxY, maxZ]
  ];
}
