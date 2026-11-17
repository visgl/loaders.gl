import {expect, test} from 'vitest';
import {Matrix4} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';
import {BoundingSphere} from '@math.gl/culling';
import convertB3dmToI3sGeometry from '../apps/tile-converter/src/i3s-converter/helpers/geometry-converter';

/** Converts two triangles sharing one output material, without network or compression. */
async function convertTriangles(shouldMergeMaterials: boolean) {
  const positions = new Float32Array([0, 0, 0, 0.125, 0, 0, 0, 0.125, 0]);
  const center = Ellipsoid.WGS84.cartographicToCartesian([8.05, 52.27, 0]);
  const materials = [0, 1].map((index) => ({
    id: String(index),
    pbrMetallicRoughness: {baseColorFactor: index ? [0, 1, 0, 1] : [1, 0, 0, 1]}
  }));
  const gltf = {
    materials,
    nodes: [
      {
        mesh: {
          primitives: materials.map((material) => ({
            material,
            attributes: {POSITION: {value: positions, size: 3}}
          }))
        }
      }
    ]
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

test.each([true, false])(
  'generated bounds retain merged=%s geometry at its ECEF location',
  async (merge) => {
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
  }
);
