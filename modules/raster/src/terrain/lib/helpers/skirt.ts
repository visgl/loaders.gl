// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createTerrainSkirt} from '@math.gl/geospatial/terrain';

export type EdgeIndices = {
  westIndices: number[];
  northIndices: number[];
  eastIndices: number[];
  southIndices: number[];
};

/** Add a visual skirt while retaining the loader's texture coordinates and index representation. */
export function addSkirt(attributes, triangles, skirtHeight: number, outsideIndices?: EdgeIndices) {
  const positions = attributes.POSITION.value;
  const sourceIndices = Array.isArray(triangles) ? Uint32Array.from(triangles) : triangles;
  const edges = outsideIndices ? getBoundaryEdges(outsideIndices, positions) : undefined;
  const skirt = createTerrainSkirt(
    {positions, indices: sourceIndices},
    {height: skirtHeight, edges}
  );
  const textureCoordinates = attributes.TEXCOORD_0.value;
  const outputTextureCoordinates = new textureCoordinates.constructor(
    (skirt.positions.length / 3) * 2
  );
  outputTextureCoordinates.set(textureCoordinates);
  for (let i = 0; i < skirt.sourceVertexIndices.length; i++) {
    const source = skirt.sourceVertexIndices[i];
    outputTextureCoordinates.set(
      textureCoordinates.subarray(source * 2, source * 2 + 2),
      (skirt.skirtVertexOffset + i) * 2
    );
  }
  attributes.POSITION.value = skirt.positions;
  attributes.TEXCOORD_0.value = outputTextureCoordinates;
  return {
    attributes,
    triangles: Array.isArray(triangles) ? Array.from(skirt.indices) : skirt.indices
  };
}

/** Translate quantized mesh side lists into selected boundary edge pairs. */
function getBoundaryEdges(
  indices: EdgeIndices,
  positions: Float32Array | Float64Array
): Uint32Array {
  indices.westIndices.sort((a, b) => positions[3 * a + 1] - positions[3 * b + 1]);
  indices.eastIndices.sort((a, b) => positions[3 * b + 1] - positions[3 * a + 1]);
  indices.southIndices.sort((a, b) => positions[3 * b] - positions[3 * a]);
  indices.northIndices.sort((a, b) => positions[3 * a] - positions[3 * b]);
  const edges: number[] = [];
  for (const side of [
    indices.westIndices,
    indices.northIndices,
    indices.eastIndices,
    indices.southIndices
  ]) {
    for (let i = 1; i < side.length; i++) edges.push(side[i - 1], side[i]);
  }
  return Uint32Array.from(edges);
}
