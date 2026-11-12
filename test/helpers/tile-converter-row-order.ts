// Adapted from the deterministic reproduction in https://github.com/visgl/loaders.gl/issues/4477.
import {Buffer} from 'node:buffer';

const COLORS = [
  [0.8, 0.2, 0.2, 1.0],
  [0.2, 0.2, 0.8, 1.0]
];

/** Align a GLB or b3dm section. */
const padBuffer = (buffer: Buffer, start: number, alignment: number, fill: number) =>
  Buffer.concat([
    buffer,
    Buffer.alloc((alignment - ((start + buffer.length) % alignment)) % alignment, fill)
  ]);

/** Emit a distinct triangle count for each source batch ID. */
function createTriangles(feature: number, offsetY: number) {
  // feature k: k + 1 small triangles in a row, z-up metres in the tile's local frame
  const result = [];
  for (let triangleIndex = 0; triangleIndex <= feature; triangleIndex++) {
    const x = feature * 100 + triangleIndex * 12;
    result.push([
      [x, offsetY, 0],
      [x + 10, offsetY, 0],
      [x, offsetY + 10, 0]
    ]);
  }
  return result;
}

/** Build the reporter's unindexed, multi-material GLB. */
function createGlb(primitiveFeatures: number[][], offsetY: number) {
  const chunks = [];
  const accessors = [];
  const bufferViews = [];
  const primitives = [];
  let offset = 0;
  primitiveFeatures.forEach((features, material) => {
    const positions = [];
    const batchIds = [];
    for (const feature of features) {
      for (const triangle of createTriangles(feature, offsetY)) {
        for (const vertex of triangle) {
          positions.push(vertex);
          batchIds.push(feature);
        }
      }
    }
    const positionBuffer = Buffer.alloc(positions.length * 12);
    positions.flat().forEach((value, index) => positionBuffer.writeFloatLE(value, index * 4));
    const batchIdBuffer = Buffer.alloc(batchIds.length * 4);
    batchIds.forEach((value, index) => batchIdBuffer.writeFloatLE(value, index * 4));
    const xCoordinates = positions.map(position => position[0]);
    const yCoordinates = positions.map(position => position[1]);
    bufferViews.push({
      buffer: 0,
      byteOffset: offset,
      byteLength: positionBuffer.length,
      target: 34962
    });
    accessors.push({
      bufferView: bufferViews.length - 1,
      componentType: 5126,
      count: positions.length,
      type: 'VEC3',
      min: [Math.min(...xCoordinates), Math.min(...yCoordinates), 0],
      max: [Math.max(...xCoordinates), Math.max(...yCoordinates), 0]
    });
    offset += positionBuffer.length;
    bufferViews.push({
      buffer: 0,
      byteOffset: offset,
      byteLength: batchIdBuffer.length,
      target: 34962
    });
    accessors.push({
      bufferView: bufferViews.length - 1,
      componentType: 5126,
      count: batchIds.length,
      type: 'SCALAR',
      min: [Math.min(...batchIds)],
      max: [Math.max(...batchIds)]
    });
    offset += batchIdBuffer.length;
    chunks.push(positionBuffer, batchIdBuffer);
    primitives.push({
      attributes: {POSITION: accessors.length - 2, _BATCHID: accessors.length - 1},
      material
    });
  });
  const binaryBuffer = Buffer.concat(chunks);
  const gltf = {
    asset: {version: '2.0'},
    scene: 0,
    scenes: [{nodes: [0]}],
    nodes: [{mesh: 0}],
    meshes: [{primitives}],
    materials: primitiveFeatures.map((_, index) => ({
      pbrMetallicRoughness: {baseColorFactor: COLORS[index], metallicFactor: 0.0}
    })),
    accessors,
    bufferViews,
    buffers: [{byteLength: binaryBuffer.length}]
  };
  const json = padBuffer(Buffer.from(JSON.stringify(gltf)), 0, 4, 0x20);
  const chunk = (data: Buffer, type: string) => {
    const header = Buffer.alloc(8);
    header.writeUInt32LE(data.length, 0);
    header.write(type, 4);
    return Buffer.concat([header, data]);
  };
  const header = Buffer.alloc(12);
  header.write('glTF', 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + json.length + 8 + binaryBuffer.length, 8);
  return Buffer.concat([header, chunk(json, 'JSON'), chunk(binaryBuffer, 'BIN\0')]);
}

/** Build the tiny b3dm fixture from issue #4477, with configurable mesh order. */
export function createRowOrderTile(
  batchTable: {name: string[]; triangles: number[]},
  primitiveFeatures: number[][],
  offsetY = 0
) {
  const featureTable = padBuffer(
    Buffer.from(JSON.stringify({BATCH_LENGTH: batchTable.name.length})),
    28,
    8,
    0x20
  );
  const batch = padBuffer(
    Buffer.from(JSON.stringify(batchTable)),
    28 + featureTable.length,
    8,
    0x20
  );
  const body = createGlb(primitiveFeatures, offsetY);
  const header = Buffer.alloc(28);
  header.write('b3dm', 0);
  header.writeUInt32LE(1, 4);
  header.writeUInt32LE(28 + featureTable.length + batch.length + body.length, 8);
  header.writeUInt32LE(featureTable.length, 12);
  header.writeUInt32LE(0, 16);
  header.writeUInt32LE(batch.length, 20);
  header.writeUInt32LE(0, 24);
  return Buffer.concat([header, featureTable, batch, body]);
}
