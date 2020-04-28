import decode from '@here/quantized-mesh-decoder';
import {getMeshBoundingBox} from '@loaders.gl/loader-utils';

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
    positions[3 * i + 0] = x * xScale + minX;
    texCoords[2 * i + 0] = x;
  }

  for (let i = 0; i < nCoords; i++) {
    const y = vertexData[i + nCoords] / 32767;
    positions[3 * i + 1] = y * yScale + minY;
    texCoords[2 * i + 1] = y;
  }

  for (let i = 0; i < nCoords; i++) {
    const z = vertexData[i + nCoords * 2] / 32767;
    positions[3 * i + 2] = z * zScale + minHeight;
  }

  return {
    POSITION: {value: positions, size: 3},
    TEXCOORD_0: {value: texCoords, size: 2}
    // NORMAL: {}, - optional, but creates the high poly look with lighting
  };
}

function getTileMesh(arrayBuffer, options) {
  if (!arrayBuffer) {
    return null;
  }
  const {bounds} = options;
  const {header, vertexData, triangleIndices} = decode(arrayBuffer);
  const attributes = getMeshAttributes(vertexData, header, bounds);

  return {
    // Data return by this loader implementation
    loaderData: {
      header: {}
    },
    header: {
      vertexCount: triangleIndices.length,
      boundingBox: getMeshBoundingBox(attributes)
    },
    mode: 4, // TRIANGLES
    indices: {value: triangleIndices, size: 1},
    attributes
  };
}

export default async function loadQuantizedMesh(arrayBuffer, options, context) {
  return getTileMesh(arrayBuffer, options.quantizedMesh);
}
