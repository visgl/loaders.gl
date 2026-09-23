// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {MeshAttributes} from '../categories/category-mesh';

type BoundingBox = [[number, number, number], [number, number, number]];

/**
 * Get the (axis aligned) bounding box of a mesh.
 * @param attributes Mesh attributes.
 * @returns The axis aligned bounding box as minimum and maximum vectors.
 * @deprecated Import `getMeshBoundingBox` from `@loaders.gl/schema-utils` instead. This root
 * export remains temporarily for deck.gl 9.4 compatibility.
 */
// eslint-disable-next-line complexity
export function getMeshBoundingBox(attributes: MeshAttributes): BoundingBox {
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  const positions = attributes.POSITION ? attributes.POSITION.value : [];
  const length = positions && positions.length;

  for (let index = 0; index < length; index += 3) {
    const x = positions[index];
    const y = positions[index + 1];
    const z = positions[index + 2];

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
