import {getMeshBoundingBox} from '@loaders.gl/loader-utils';
import decode, {DECODING_STEPS} from './decode-quantized-mesh';

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

function getTileMesh(arrayBuffer, options) {
  if (!arrayBuffer) {
    return null;
  }
  const {bounds} = options;
  // Don't parse edge indices or format extensions
  const {header, vertexData, triangleIndices} = decode(arrayBuffer, DECODING_STEPS.triangleIndices);
  // TODO: use skirt information from file
  const attributes = getMeshAttributes(vertexData, header, bounds);

  return {
    // Data return by this loader implementation
    loaderData: {
      header: {}
    },
    header: {
      // @ts-ignore
      vertexCount: triangleIndices.length,
      // TODO: Find bounding box from header, instead of doing extra pass over
      // vertices.
      boundingBox: getMeshBoundingBox(attributes)
    },
    mode: 4, // TRIANGLES
    indices: {value: triangleIndices, size: 1},
    attributes
  };
}

export default function loadQuantizedMesh(arrayBuffer, options) {
  return getTileMesh(arrayBuffer, options['quantized-mesh']);
}
