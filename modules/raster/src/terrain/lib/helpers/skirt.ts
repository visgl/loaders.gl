// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {concatenateTypedArrays} from '@loaders.gl/loader-utils';

export type EdgeIndices = {
  westIndices: number[];
  northIndices: number[];
  eastIndices: number[];
  southIndices: number[];
};

/**
 * Add skirt to existing mesh
 * @param {object} attributes - POSITION and TEXCOOD_0 attributes data
 * @param {any} triangles - indices array of the mesh geometry
 * @param skirtHeight - height of the skirt geometry
 * @param outsideIndices - edge indices from quantized mesh data
 * @returns - geometry data with added skirt
 */
export function addSkirt(attributes, triangles, skirtHeight: number, outsideIndices?: EdgeIndices) {
  const outsideEdges = outsideIndices
    ? getOutsideEdgesFromIndices(outsideIndices, attributes.POSITION.value)
    : getOutsideEdgesFromTriangles(triangles);

  // 2 new vertices for each outside edge
  const newPosition = new attributes.POSITION.value.constructor(outsideEdges.length * 6);
  const newTexcoord0 = new attributes.TEXCOORD_0.value.constructor(outsideEdges.length * 4);

  // 2 new triangles for each outside edge
  const newTriangles = new triangles.constructor(outsideEdges.length * 6);

  for (let i = 0; i < outsideEdges.length; i++) {
    const edge = outsideEdges[i];

    updateAttributesForNewEdge({
      edge,
      edgeIndex: i,
      attributes,
      skirtHeight,
      newPosition,
      newTexcoord0,
      newTriangles
    });
  }

  attributes.POSITION.value = concatenateTypedArrays(attributes.POSITION.value, newPosition);
  attributes.TEXCOORD_0.value = concatenateTypedArrays(attributes.TEXCOORD_0.value, newTexcoord0);
  const resultTriangles =
    triangles instanceof Array
      ? triangles.concat(newTriangles)
      : concatenateTypedArrays(triangles, newTriangles);

  return {
    attributes,
    triangles: resultTriangles
  };
}

/**
 * Get geometry edges that located on a border of the mesh
 * @param {any} triangles - indices array of the mesh geometry
 * @returns {number[][]} - outside edges data
 */
function getOutsideEdgesFromTriangles(triangles) {
  const edges: number[][] = [];
  for (let i = 0; i < triangles.length; i += 3) {
    edges.push([triangles[i], triangles[i + 1]]);
    edges.push([triangles[i + 1], triangles[i + 2]]);
    edges.push([triangles[i + 2], triangles[i]]);
  }

  edges.sort((a, b) => Math.min(...a) - Math.min(...b) || Math.max(...a) - Math.max(...b));

  const outsideEdges: number[][] = [];
  let index = 0;
  while (index < edges.length) {
    if (edges[index][0] === edges[index + 1]?.[1] && edges[index][1] === edges[index + 1]?.[0]) {
      index += 2;
    } else {
      outsideEdges.push(edges[index]);
      index++;
    }
  }
  return outsideEdges;
}

/**
 * Get geometry edges that located on a border of the mesh
 * @param {object} indices - edge indices from quantized mesh data
 * @param {TypedArray} position - position attribute geometry data
 * @returns {number[][]} - outside edges data
 */
function getOutsideEdgesFromIndices(indices: EdgeIndices, position) {
  // Sort skirt indices to create adjacent triangles
  indices.westIndices.sort((a, b) => position[3 * a + 1] - position[3 * b + 1]);
  // Reverse (b - a) to match triangle winding
  indices.eastIndices.sort((a, b) => position[3 * b + 1] - position[3 * a + 1]);
  indices.southIndices.sort((a, b) => position[3 * b] - position[3 * a]);
  // Reverse (b - a) to match triangle winding
  indices.northIndices.sort((a, b) => position[3 * a] - position[3 * b]);

  const edges: number[][] = [];
  for (const index in indices) {
    const indexGroup = indices[index];
    for (let i = 0; i < indexGroup.length - 1; i++) {
      edges.push([indexGroup[i], indexGroup[i + 1]]);
    }
  }
  return edges;
}

/**
 * Get geometry edges that located on a border of the mesh
 * @param {object} args
 * @param {number[]} args.edge - edge indices in geometry
 * @param {number} args.edgeIndex - edge index in outsideEdges array
 * @param {object} args.attributes - POSITION and TEXCOORD_0 attributes
 * @param {number} args.skirtHeight - height of the skirt geometry
 * @param {TypedArray} args.newPosition - POSITION array for skirt data
 * @param {TypedArray} args.newTexcoord0 - TEXCOORD_0 array for skirt data
 * @param {TypedArray | Array} args.newTriangles - trinagle indices array for skirt data
 * @returns {void}
 */
function updateAttributesForNewEdge({
  edge,
  edgeIndex,
  attributes,
  skirtHeight,
  newPosition,
  newTexcoord0,
  newTriangles
}) {
  const positionsLength = attributes.POSITION.value.length;
  const vertex1Offset = edgeIndex * 2;
  const vertex2Offset = edgeIndex * 2 + 1;

  // Define POSITION for new 1st vertex
  newPosition.set(
    attributes.POSITION.value.subarray(edge[0] * 3, edge[0] * 3 + 3),
    vertex1Offset * 3
  );
  newPosition[vertex1Offset * 3 + 2] = newPosition[vertex1Offset * 3 + 2] - skirtHeight; // put down elevation on the skirt height

  // Define POSITION for new 2nd vertex
  newPosition.set(
    attributes.POSITION.value.subarray(edge[1] * 3, edge[1] * 3 + 3),
    vertex2Offset * 3
  );
  newPosition[vertex2Offset * 3 + 2] = newPosition[vertex2Offset * 3 + 2] - skirtHeight; // put down elevation on the skirt height

  // Use same TEXCOORDS for skirt vertices
  newTexcoord0.set(
    attributes.TEXCOORD_0.value.subarray(edge[0] * 2, edge[0] * 2 + 2),
    vertex1Offset * 2
  );
  newTexcoord0.set(
    attributes.TEXCOORD_0.value.subarray(edge[1] * 2, edge[1] * 2 + 2),
    vertex2Offset * 2
  );

  // Define new triangles
  const triangle1Offset = edgeIndex * 2 * 3;
  newTriangles[triangle1Offset] = edge[0];
  newTriangles[triangle1Offset + 1] = positionsLength / 3 + vertex2Offset;
  newTriangles[triangle1Offset + 2] = edge[1];

  newTriangles[triangle1Offset + 3] = positionsLength / 3 + vertex2Offset;
  newTriangles[triangle1Offset + 4] = edge[0];
  newTriangles[triangle1Offset + 5] = positionsLength / 3 + vertex1Offset;
}
