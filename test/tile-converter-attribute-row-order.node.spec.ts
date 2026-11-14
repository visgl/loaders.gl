import {beforeAll, expect, test} from 'vitest';
import {parse} from '@loaders.gl/core';
import {Tiles3DLoader, type Tiles3DTileContent} from '@loaders.gl/tiles-3d/3d-tiles';
import {Matrix4} from '@math.gl/core';
import {BoundingSphere} from '@math.gl/geometry/culling';
import convertB3dmToI3sGeometry from '../apps/tile-converter/src/v4/i3s-converter/helpers/geometry-converter';
import {AttributeMetadataInfo} from '../apps/tile-converter/src/v4/i3s-converter/helpers/attribute-metadata-info';
import {createRowOrderTile} from './helpers/tile-converter-row-order';

const cases = [
  {label: 'one material', primitives: [[2, 0, 3, 1]], prefix: 'A'},
  {
    label: 'two materials',
    primitives: [
      [2, 0],
      [3, 1]
    ],
    prefix: 'B'
  },
  {label: 'repeated triangle runs', primitives: [[2, 0, 2, 1]], prefix: 'C'},
  {
    label: 'shared feature across materials',
    primitives: [
      [2, 0],
      [3, 2, 1]
    ],
    prefix: 'D'
  }
];
const parsedTiles = new Map<string, Tiles3DTileContent>();
const metadata = new AttributeMetadataInfo();
metadata.addMetadataInfo({name: 'string', triangles: 'Int32'});

beforeAll(async () => {
  for (const item of cases) {
    const table = {name: [0, 1, 2, 3].map(index => item.prefix + index), triangles: [1, 2, 3, 4]};
    const bytes = createRowOrderTile(table, item.primitives);
    parsedTiles.set(item.label, await parse(bytes, Tiles3DLoader, {core: {worker: false}}));
  }
});

/** Decode the counted, null-terminated string attribute buffer. */
function decodeStrings(buffer: ArrayBuffer): string[] {
  const view = new DataView(buffer);
  const count = view.getUint32(0, true);
  let offset = 8 + count * 4;
  return Array.from({length: count}, (_, index) => {
    const size = view.getUint32(8 + index * 4, true);
    const value = new TextDecoder().decode(new Uint8Array(buffer, offset, size - 1));
    offset += size;
    return value;
  });
}

test.each([
  true,
  false
])('legacy I3S pairs attributes and IDs with geometry (merge materials: %s)', async shouldMergeMaterials => {
  const featuresHashArray: string[] = [];
  const objectIdsByName = new Map<string, number>();
  let nextNodeId = 0;
  for (const item of cases) {
    const tileContent = structuredClone(parsedTiles.get(item.label)!);
    const resources = await convertB3dmToI3sGeometry({
      tileContent,
      tileTransform: new Matrix4().translate([6378137, 0, 0]),
      tileBoundingVolume: new BoundingSphere([6378137, 0, 0], 1000),
      addNodeToNodePage: async () => nextNodeId++,
      propertyTable: tileContent.batchTableJson,
      featuresHashArray,
      attributeStorageInfo: metadata.attributeStorageInfo,
      draco: false,
      generateBoundingVolumes: false,
      shouldMergeMaterials,
      geoidHeightModel: null,
      libraries: {}
    });
    expect(resources).not.toBeNull();
    const groups = shouldMergeMaterials ? [item.primitives.flat()] : item.primitives;
    expect(resources).toHaveLength(groups.length);
    for (const [resourceIndex, resource] of resources!.entries()) {
      const sourceBatchIds = [...new Set(groups[resourceIndex])];
      expect(resource.geometry).not.toBeNull();
      expect(resource.attributes).not.toBeNull();
      const geometryBytes = resource.geometry as unknown as Uint8Array;
      const geometry = new DataView(
        geometryBytes.buffer,
        geometryBytes.byteOffset,
        geometryBytes.byteLength
      );
      const featureCount = geometry.getUint32(4, true);
      expect(featureCount).toBe(sourceBatchIds.length);
      // Untextured geometry ends with feature IDs (UInt64) and face ranges (2 x UInt32).
      const featureIdOffset = geometry.byteLength - featureCount * 16;
      const faceRangeOffset = geometry.byteLength - featureCount * 8;
      const objectIds = Array.from(new Uint32Array(resource.attributes![0], 4));
      const names = decodeStrings(resource.attributes![1]);
      const triangleCounts = Array.from(new Int32Array(resource.attributes![2], 4));
      expect(names).toEqual(sourceBatchIds.map(batchId => item.prefix + batchId));
      expect(triangleCounts).toEqual(sourceBatchIds.map(batchId => batchId + 1));
      for (const [index, batchId] of sourceBatchIds.entries()) {
        expect(Number(geometry.getBigUint64(featureIdOffset + index * 8, true))).toBe(
          objectIds[index]
        );
        const geometryTriangleCount =
          geometry.getUint32(faceRangeOffset + index * 8 + 4, true) -
          geometry.getUint32(faceRangeOffset + index * 8, true) +
          1;
        const occurrences = groups[resourceIndex].filter(value => value === batchId).length;
        expect(geometryTriangleCount).toBe(triangleCounts[index] * occurrences);
        const name = names[index];
        if (objectIdsByName.has(name)) {
          expect(objectIds[index]).toBe(objectIdsByName.get(name));
        } else {
          expect([...objectIdsByName.values()]).not.toContain(objectIds[index]);
          objectIdsByName.set(name, objectIds[index]);
        }
      }
    }
  }
});
