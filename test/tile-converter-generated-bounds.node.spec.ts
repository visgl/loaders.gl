import {expect, test} from 'vitest';
import {Matrix4} from '@math.gl/core/matrix';
import {Ellipsoid} from '@math.gl/geospatial/ellipsoid';
import {BoundingSphere} from '@math.gl/geometry/culling';
import convertB3dmToI3sGeometry from '../apps/tile-converter/src/v4/i3s-converter/helpers/geometry-converter';

/** Converts two triangles sharing one output material, without network or compression. */
async function convertTriangles(shouldMergeMaterials: boolean) {
  const positions = new Float32Array([0, 0, 0, 0.125, 0, 0, 0, 0.125, 0]);
  const center = Ellipsoid.WGS84.cartographicToCartesian([8.05, 52.27, 0]);
  const gltf = {
    json: {
      asset: {version: '2.0'},
      buffers: [{byteLength: positions.byteLength}],
      bufferViews: [{buffer: 0, byteOffset: 0, byteLength: positions.byteLength}],
      accessors: [{bufferView: 0, componentType: 5126, count: 3, type: 'VEC3'}],
      materials: [
        {pbrMetallicRoughness: {baseColorFactor: [1, 0, 0, 1]}},
        {pbrMetallicRoughness: {baseColorFactor: [0, 1, 0, 1]}}
      ],
      meshes: [{primitives: [0, 1].map(material => ({attributes: {POSITION: 0}, material}))}],
      nodes: [{mesh: 0}],
      scenes: [{nodes: [0]}],
      scene: 0
    },
    buffers: [{arrayBuffer: positions.buffer, byteOffset: 0, byteLength: positions.byteLength}],
    images: []
  };
  let nodeId = 0;
  return convertB3dmToI3sGeometry({
    tileContent: {gltf, gltfUpAxis: 'Z'} as never,
    tileTransform: new Matrix4().translate(center),
    tileBoundingVolume: new BoundingSphere(center, 1),
    addNodeToNodePage: async () => ++nodeId,
    propertyTable: null,
    featuresHashArray: [],
    attributeStorageInfo: [],
    draco: false,
    generateBoundingVolumes: true,
    shouldMergeMaterials,
    geoidHeightModel: null,
    libraries: {}
  });
}

test.each([
  true,
  false
])('generated bounds retain merged=%s geometry at its ECEF location', async merge => {
  const resources = (await convertTriangles(merge))!;
  expect(resources).toHaveLength(merge ? 1 : 2);
  const expected = Ellipsoid.WGS84.cartographicToCartesian([8.05, 52.27, 0]);
  for (const resource of resources) {
    const center = resource.boundingVolumes!.obb.center;
    const positions = new Float32Array(
      resource.geometry.buffer,
      resource.geometry.byteOffset + 8,
      resource.vertexCount * 3
    );
    for (let index = 0; index < positions.length; index += 3) {
      const geographic = Array.from(center, (value, axis) => value + positions[index + axis]);
      const actual = Ellipsoid.WGS84.cartographicToCartesian(geographic);
      const vertex = (index / 3) % 3;
      expect(actual[0]).toBeCloseTo(expected[0] + (vertex === 1 ? 0.125 : 0), 3);
      expect(actual[1]).toBeCloseTo(expected[1] + (vertex === 2 ? 0.125 : 0), 3);
      expect(actual[2]).toBeCloseTo(expected[2], 3);
    }
  }
});
