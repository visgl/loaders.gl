// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Mesh, getMeshBoundingBox} from '@loaders.gl/schema';
import decode, {DECODING_STEPS} from './decode-quantized-mesh';
import {addSkirt} from './helpers/skirt';

export type ParseQuantizedMeshOptions = {
  bounds?: [number, number, number, number];
  skirtHeight?: number | null;
};

export function parseQuantizedMesh(
  arrayBuffer: ArrayBuffer,
  options: ParseQuantizedMeshOptions = {}
): Mesh {
  const {bounds} = options;
  // Don't parse edge indices or format extensions
  const {
    header,
    vertexData,
    triangleIndices: originalTriangleIndices,
    westIndices,
    northIndices,
    eastIndices,
    southIndices
  } = decode(arrayBuffer, DECODING_STEPS.triangleIndices);
  let triangleIndices = originalTriangleIndices;
  let attributes = getMeshAttributes(vertexData, header, bounds);

  // Compute bounding box before adding skirt so that z values are not skewed
  // TODO: Find bounding box from header, instead of doing extra pass over
  // vertices.
  const boundingBox = getMeshBoundingBox(attributes);

  if (options?.skirtHeight) {
    const {attributes: newAttributes, triangles: newTriangles} = addSkirt(
      attributes,
      triangleIndices,
      options.skirtHeight,
      {
        westIndices,
        northIndices,
        eastIndices,
        southIndices
      }
    );
    attributes = newAttributes;
    triangleIndices = newTriangles;
  }

  return {
    // Data return by this loader implementation
    loaderData: {
      header: {}
    },
    header: {
      // @ts-ignore
      vertexCount: triangleIndices.length,
      boundingBox
    },
    // TODO
    schema: undefined!,
    topology: 'triangle-list',
    mode: 4, // TRIANGLES
    indices: {value: triangleIndices, size: 1},
    attributes
  };
}

function getMeshAttributes(vertexData, header, bounds) {
  const {minHeight, maxHeight} = header;
  const [minX, minY, maxX, maxY] = bounds || [0, 0, 1, 1];
  const xScale = maxX - minX;
  const yScale = maxY - minY;
  const zScale = maxHeight - minHeight;

  const nCoords = vertexData.length / 3;
  // vec3. x, y defined by bounds, z in meters
  const positions = new Float32Array(nCoords * 3);

  // vec2. 1 to 1 relationship with position. represents the uv on the texture image. 0,0 to 1,1.
  const texCoords = new Float32Array(nCoords * 2);

  // Data is not interleaved; all u, then all v, then all heights
  for (let i = 0; i < nCoords; i++) {
    const x = vertexData[i] / 32767;
    const y = vertexData[i + nCoords] / 32767;
    const z = vertexData[i + nCoords * 2] / 32767;

    positions[3 * i + 0] = x * xScale + minX;
    positions[3 * i + 1] = y * yScale + minY;
    positions[3 * i + 2] = z * zScale + minHeight;

    texCoords[2 * i + 0] = x;
    texCoords[2 * i + 1] = y;
  }

  return {
    POSITION: {value: positions, size: 3},
    TEXCOORD_0: {value: texCoords, size: 2}
    // TODO: Parse normals if they exist in the file
    // NORMAL: {}, - optional, but creates the high poly look with lighting
  };
}
