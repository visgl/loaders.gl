// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Ellipsoid} from '@math.gl/geospatial';
import {encodeI3SMeshLayer} from '@loaders.gl/i3s';
import {I3SNodePageSchema, I3SSceneLayerSchema} from '@loaders.gl/i3s/i3s-zod-schema';
import {GZipDecompressor} from '@loaders.gl/compression/gzip-decompressor';
import {
  createI3SMeshSink,
  createSingleMeshI3SSink,
  convertTileset,
  createI3SMeshConversionCodec,
  createTiles3DConversionSpatialContext,
  type MeshSourceResource
} from '@loaders.gl/tile-converter/v5';

/** Distinct nearby placements with materials and finite geographic positions. */
function createResource(index: number): MeshSourceResource {
  return {
    id: String(index),
    origin: [0, 0, 0],
    material: {baseColorFactor: index % 2 ? [1, 0, 0, 1] : [0, 1, 0, 1]},
    mesh: {
      topology: 'triangle-list',
      mode: 4,
      attributes: {
        POSITION: {
          size: 3,
          value: new Float64Array(
            [
              [10 + index * 0.0001, 45, 100],
              [10 + index * 0.0001 + 0.00001, 45, 100],
              [10 + index * 0.0001, 45.00001, 100]
            ].flatMap(position => Array.from(Ellipsoid.WGS84.cartographicToCartesian(position)))
          )
        }
      }
    }
  };
}
const OPTIONS = {maxResourceBytes: 65536, maxPositionError: 0.001};
/** Runs the actual codec so generated OID ranges are allocated across placements. */
async function convertCollection(count: number, maxTotalBytes = 1000000) {
  const source = {
    inspect: async () => ({}),
    async *read() {
      for (let index = 0; index < count; index++) yield createResource(index);
    }
  };
  const sink = createI3SMeshSink({...OPTIONS, maxMeshes: 64, maxTotalBytes});
  const report = await convertTileset({
    source,
    sink,
    measureInputBytes: resource => resource.mesh.attributes.POSITION.value.byteLength,
    measureOutputBytes: resource =>
      Object.values(resource.files).reduce((total, bytes) => total + bytes.byteLength, 0),
    codec: createI3SMeshConversionCodec({
      ...OPTIONS,
      draco: false,
      spatialContext: createTiles3DConversionSpatialContext({
        sourceCrs: 'EPSG:4978',
        coordinateFrame: 'geocentric',
        heightReference: 'ellipsoidal'
      })
    })
  });
  return {sink, report};
}
/** Reads compressed JSON from finalized files only. */
async function readJson(
  files: ReturnType<ReturnType<typeof createI3SMeshSink>['getFiles']>,
  name: string
) {
  const bytes = await files.find(file => file.resourceId === name)!.blob.arrayBuffer();
  return JSON.parse(
    new TextDecoder().decode(new GZipDecompressor({useNative: false}).decompressSync(bytes))
  );
}

test.each([
  2, 64
])('SLPK collection rebuilds %s leaf indices, paginates, retains materials and bounds', async count => {
  const {sink, report} = await convertCollection(count);
  const files = sink.getFiles();
  expect(report.outputResources).toBe(count);
  const layer = await readJson(files, '3dSceneLayer.json.gz');
  const page = await readJson(files, 'nodepages/0.json.gz');
  expect(I3SSceneLayerSchema.safeParse(layer).success).toBe(true);
  expect(I3SNodePageSchema.safeParse(page).success).toBe(true);
  expect(page.nodes[0].children).toHaveLength(count);
  expect(page.nodes[0].mesh).toBeUndefined();
  expect(layer.materialDefinitions).toHaveLength(count);
  expect(page.nodes[2].mesh).toMatchObject({
    geometry: {resource: 2, definition: 1},
    material: {definition: 1},
    attribute: {resource: 2}
  });
  if (count === 64) {
    const second = await readJson(files, 'nodepages/1.json.gz');
    expect(I3SNodePageSchema.safeParse(second).success).toBe(true);
    expect(second.nodes).toHaveLength(1);
    expect(second.nodes[0].index).toBe(64);
  }
  const root = await readJson(files, 'nodes/root/3dNodeIndexDocument.json.gz');
  const center = Ellipsoid.WGS84.cartographicToCartesian(root.obb.center);
  for (const child of root.children) {
    const childCenter = Ellipsoid.WGS84.cartographicToCartesian(child.obb.center);
    for (let axis = 0; axis < 3; axis++)
      expect(
        Math.abs(childCenter[axis] - center[axis]) + child.obb.halfSize[axis]
      ).toBeLessThanOrEqual(root.obb.halfSize[axis]);
  }
  const leaf = await readJson(files, `nodes/${count}/3dNodeIndexDocument.json.gz`);
  expect(leaf.parentNode.obb).toEqual(root.obb);
  expect((await readJson(files, 'metadata.json.gz')).nodeCount).toBe(count + 1);
  const lastIds = new GZipDecompressor({useNative: false}).decompressSync(
    await files
      .find(file => file.resourceId === `nodes/${count}/attributes/f_0/0.bin.gz`)!
      .blob.arrayBuffer()
  );
  expect(new DataView(lastIds).getUint32(4, true)).toBe(count - 1);
});

test('SLPK collection is atomic on limits, schema mismatch, repeated OIDs and abort', async () => {
  await expect(convertCollection(2, 1)).rejects.toMatchObject({
    code: 'OUTPUT_MEMORY_LIMIT_EXCEEDED'
  });
  const sink = createI3SMeshSink({...OPTIONS, maxMeshes: 2, maxTotalBytes: 1000000});
  expect(sink.getFiles()).toEqual([]);
  const first = {id: 'first', ...encodeI3SMeshLayer(createResource(0).mesh, OPTIONS)};
  await sink.write(first);
  expect(sink.getFiles()).toEqual([]);
  await expect(sink.write({...first, id: 'second'})).rejects.toMatchObject({
    code: 'I3S_COLLECTION_IDS_INVALID'
  });
  await sink.abort(new Error('failed'));
  expect(sink.getFiles()).toEqual([]);
  await expect(sink.write(first)).rejects.toMatchObject({code: 'I3S_COLLECTION_UNAVAILABLE'});
  const mismatched = createResource(1).mesh;
  mismatched.attributes.NORMAL = {value: new Float32Array([1, 0, 0, 1, 0, 0, 1, 0, 0]), size: 3};
  const secondSink = createI3SMeshSink({...OPTIONS, maxMeshes: 2, maxTotalBytes: 1000000});
  await secondSink.write(first);
  await expect(
    secondSink.write({
      id: 'second',
      ...encodeI3SMeshLayer(mismatched, {...OPTIONS, objectIdOffset: 1})
    })
  ).rejects.toMatchObject({code: 'I3S_COLLECTION_SCHEMA_MISMATCH'});
  await secondSink.abort(new Error('failed'));
});

test.each([
  ['nodes/1/textures/0.png', 'image/png'],
  ['nodes/1/textures/0.jpg', 'image/jpeg'],
  ['nodes/1/geometries/0.bin.gz', 'application/gzip']
])('single-mesh sink retains the MIME type of %s', async (resourceId, contentType) => {
  const bytes = new Uint8Array([1, 2, 3]);
  const resource = {
    id: 'mesh',
    files: {[resourceId]: bytes.buffer},
    maximumPositionError: 0,
    decimalStringFields: []
  };
  const sink = createSingleMeshI3SSink({maxTotalBytes: 16});
  await convertTileset({
    source: {
      inspect: async () => ({}),
      async *read() {
        yield resource;
      }
    },
    codec: {
      async *convert(input) {
        yield input;
      }
    },
    sink,
    measureInputBytes: () => bytes.length,
    measureOutputBytes: () => bytes.length
  });
  expect(sink.getFiles()[0].blob.type).toBe(contentType);
  expect(new Uint8Array(await sink.getFiles()[0].blob.arrayBuffer())).toEqual(bytes);
});
