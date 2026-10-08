// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, beforeAll, expect, test, vi} from 'vitest';
import {parse} from '@loaders.gl/core';
import {Tiles3DLoader, type Tiles3DTileContent} from '@loaders.gl/3d-tiles';
import {GLTFLoader, GLTFScenegraph, GLTFWriter, postProcessGLTF} from '@loaders.gl/gltf';
import type {GLTFMeshPrimitivePostprocessed} from '@loaders.gl/gltf';
import {Tiles3DSource, Tileset3D} from '@loaders.gl/tiles';
import {Matrix4} from '@math.gl/core';
import {GZipCompression} from '@loaders.gl/compression';
import {encodeI3SMeshLayer} from '@loaders.gl/i3s';
import {validateBytes} from 'gltf-validator';
import {createCompressedMesh} from './utils/tile-converter-draco';
import {
  createMeshTilesetConversionSource,
  createMeshConversionCodec,
  createI3SMeshConversionCodec
} from '@loaders.gl/tile-converter/v5/adapters';
import type {MeshSourceResource} from '@loaders.gl/tile-converter/v5/adapters';
import {createTiles3DConversionSpatialContext as createSpatialContext} from '@loaders.gl/tile-converter/v5/core';

const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0, 2, 0, 1, 2, 0]);
const expectedStrip = [0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4];
const fixtures = new Map<string, Tiles3DTileContent>();
const runtimes: Tileset3D[] = [];

/** Authors a tiny mesh using the source topology, without pre-expanding its indices. */
function createGlb(mode: number, indices?: Uint8Array | Uint16Array | Uint32Array): ArrayBuffer {
  const scene = new GLTFScenegraph({json: {asset: {version: '2.0'}}});
  const meshIndex = scene.addMesh({
    mode,
    attributes: {
      POSITION: {value: positions, size: 3},
      NORMAL: {value: new Float32Array(Array.from({length: 6}, () => [0, 0, 1]).flat()), size: 3}
    },
    indices
  });
  scene.setDefaultScene(scene.addScene({nodeIndices: [scene.addNode({meshIndex})]}));
  scene.createBinaryChunk();
  return GLTFWriter.encodeSync!(scene.gltf);
}

beforeAll(async () => {
  for (const [name, mode, indices] of [
    ['strip-8', 5, new Uint8Array([0, 1, 2, 3, 4, 5])],
    ['strip-16', 5, new Uint16Array([0, 1, 2, 3, 4, 5])],
    ['strip-32', 5, new Uint32Array([0, 1, 2, 3, 4, 5])],
    ['strip-nonindexed', 5, undefined],
    ['fan', 6, new Uint16Array([0, 1, 3, 5, 4, 2])],
    ['fan-nonindexed', 6, undefined]
  ] as const) {
    fixtures.set(
      name,
      await parse(createGlb(mode, indices), Tiles3DLoader, {
        core: {worker: false},
        '3d-tiles': {loadGLTF: true, assetGltfUpAxis: 'Z'},
        gltf: {loadImages: false}
      })
    );
  }
  // A valid compressed quad declared as a strip must decode to exactly two triangles.
  const compressed = await createCompressedMesh({
    topology: 'triangle-list',
    mode: 4,
    attributes: {POSITION: {size: 3, value: positions.slice(0, 12)}},
    indices: {size: 1, value: new Uint16Array([0, 1, 2, 1, 3, 2])}
  });
  const container = await parse(compressed, GLTFLoader, {
    core: {worker: false},
    gltf: {decompressMeshes: false, postProcess: false}
  });
  const primitive = container.json.meshes[0].primitives[0];
  primitive.mode = 5;
  container.json.accessors[primitive.indices].count = 4;
  fixtures.set(
    'compressed-strip',
    await parse(GLTFWriter.encodeSync!(container), Tiles3DLoader, {
      core: {worker: false, useLocalLibraries: true},
      '3d-tiles': {loadGLTF: true, assetGltfUpAxis: 'Z'},
      gltf: {decompressMeshes: true, loadImages: false}
    })
  );
});

afterEach(() => {
  for (const runtime of runtimes.splice(0)) runtime.destroy();
});

/** Reuses immutable parsed content through a real source/runtime with explicit ECEF placement. */
async function createSource(payload: Tiles3DTileContent) {
  const source = new Tiles3DSource({
    shape: 'tileset3d',
    type: 'TILES3D',
    url: '/fixture/tileset.json',
    basePath: '/fixture',
    loader: Tiles3DLoader,
    asset: {version: '1.1', gltfUpAxis: 'Z'},
    lodMetricType: 'geometricError',
    lodMetricValue: 0,
    root: {
      id: 'root',
      boundingVolume: {region: [-0.001, -0.001, 0.001, 0.001, 0, 100]},
      lodMetricType: 'geometricError',
      lodMetricValue: 0,
      refine: 'ADD',
      transform: Array.from(new Matrix4().translate([6378137, 0, 0])),
      contentUrls: ['mesh.glb'],
      content: {uri: 'mesh.glb'}
    }
  });
  vi.spyOn(source, 'loadTileContent').mockResolvedValue({loaded: true, contents: [payload]});
  const runtime = new Tileset3D(source);
  runtimes.push(runtime);
  await runtime.tilesetInitializationPromise;
  return createMeshTilesetConversionSource(runtime);
}

/** Reads one supported primitive and asserts that it is the only emitted resource. */
async function readResource(payload: Tiles3DTileContent): Promise<MeshSourceResource> {
  const source = await createSource(payload);
  const resources: MeshSourceResource[] = [];
  for await (const resource of source.read(await source.inspect())) resources.push(resource);
  expect(resources).toHaveLength(1);
  return resources[0];
}

/** Clones the parsed graph only for tests that change its descriptors or buffers. */
function cloneStrip(): {payload: Tiles3DTileContent; primitive: GLTFMeshPrimitivePostprocessed} {
  const payload = structuredClone(fixtures.get('strip-16')!);
  return {payload, primitive: payload.gltf!.meshes![0].primitives[0]};
}

test.each([
  'strip-8',
  'strip-16',
  'strip-32',
  'strip-nonindexed'
])('source expands %s with glTF winding and immutable input', async name => {
  const payload = fixtures.get(name)!;
  const original = structuredClone(payload);
  const resource = await readResource(payload);
  expect(resource.mesh.mode).toBe(4);
  expect(resource.mesh.topology).toBe('triangle-list');
  expect(Array.from(resource.mesh.indices!.value)).toEqual(expectedStrip);
  expect(resource.mesh.attributes.POSITION.value).toEqual(
    new Float64Array(
      Array.from(positions, (value, index) => value + (index % 3 === 0 ? 6378137 : 0))
    )
  );
  expect(resource.mesh.attributes.NORMAL.value).toEqual(
    payload.gltf!.meshes![0].primitives[0].attributes.NORMAL.value
  );
  expect(payload).toEqual(original);
});

test.each([
  'fan',
  'fan-nonindexed'
])('source retains glTF-loader normalization for %s', async name => {
  const payload = fixtures.get(name)!;
  const primitive = payload.gltf!.meshes![0].primitives[0];
  expect(primitive.mode).toBe(4);
  const resource = await readResource(payload);
  expect(resource.mesh.indices!.value).toEqual(primitive.indices!.value);
  expect(resource.mesh.indices!.value).toHaveLength(12);
});

test('compressed mode-5 input is not expanded a second time after Draco decoding', async () => {
  const payload = fixtures.get('compressed-strip')!;
  expect(payload.gltf!.meshes[0].primitives[0].mode).toBe(4);
  const resource = await readResource(payload);
  expect(resource.mesh.indices!.value).toHaveLength(6);
  const values = resource.mesh.attributes.POSITION.value;
  const triangles: string[] = [];
  for (let triangle = 0; triangle < 2; triangle++) {
    const corners = Array.from(
      resource.mesh.indices!.value.slice(triangle * 3, triangle * 3 + 3),
      Number
    ).map(
      index =>
        `${Number(values[index * 3]) - 6378137},${values[index * 3 + 1]},${values[index * 3 + 2]}`
    );
    triangles.push(
      [0, 1, 2]
        .map(offset => [...corners.slice(offset), ...corners.slice(0, offset)].join(';'))
        .sort()[0]
    );
  }
  expect(triangles.sort()).toEqual(['0,0,0;1,0,0;0,1,0', '0,1,0;1,0,0;1,1,0']);
});

test('strip subviews retain degenerate connectors and their winding parity', async () => {
  const {payload, primitive} = cloneStrip();
  const storage = new Uint16Array([99, 0, 1, 2, 2, 3, 4, 99]);
  primitive.indices!.value = storage.subarray(1, 7);
  const resource = await readResource(payload);
  expect(Array.from(resource.mesh.indices!.value)).toEqual([0, 1, 2, 1, 2, 2, 2, 2, 3, 2, 4, 3]);
  expect(storage).toEqual(new Uint16Array([99, 0, 1, 2, 2, 3, 4, 99]));
});

test.each([0, 1, 2])('strip rejects %s source indices before expansion', async count => {
  const {payload, primitive} = cloneStrip();
  primitive.indices!.value = new Uint16Array(count);
  await expect(readResource(payload)).rejects.toMatchObject({code: 'MESH_TRIANGLE_COUNT_INVALID'});
});

test.each([
  ['range', new Uint16Array([0, 1, 6]), 'MESH_INDEX_OUT_OF_RANGE'],
  ['restart', new Uint8Array([0, 1, 255]), 'MESH_INDEX_OUT_OF_RANGE'],
  ['signed', new Int16Array([0, 1, 2]), 'MESH_INDICES_INVALID'],
  ['float', new Float32Array([0, 1, 2]), 'MESH_INDICES_INVALID']
] as const)('strip rejects %s indices without narrowing invalid values', async (_name, values, code) => {
  const {payload, primitive} = cloneStrip();
  primitive.indices!.value = values;
  await expect(readResource(payload)).rejects.toMatchObject({code});
});

test('strip keeps index 65535 by selecting Uint32 output storage', async () => {
  const {payload, primitive} = cloneStrip();
  // The smallest vertex buffer crossing the Uint16 restart boundary is 768 KiB.
  primitive.attributes.POSITION.value = new Float32Array(65536 * 3);
  primitive.attributes.POSITION.count = 65536;
  delete primitive.attributes.NORMAL;
  primitive.indices!.value = new Uint32Array([0, 1, 65535]);
  const resource = await readResource(payload);
  expect(resource.mesh.indices!.value).toBeInstanceOf(Uint32Array);
  expect(Array.from(resource.mesh.indices!.value)).toEqual([0, 1, 65535]);
});

test.each([2, 3])('non-indexed strip with %s vertices validates the minimum count', async count => {
  const {payload, primitive} = cloneStrip();
  delete primitive.indices;
  primitive.attributes.POSITION.value = positions.slice(0, count * 3);
  primitive.attributes.NORMAL.value = new Float32Array(
    Array.from({length: count}, () => [0, 0, 1]).flat()
  );
  if (count === 2)
    await expect(readResource(payload)).rejects.toMatchObject({
      code: 'MESH_TRIANGLE_COUNT_INVALID'
    });
  else expect(Array.from((await readResource(payload)).mesh.indices!.value)).toEqual([0, 1, 2]);
});

test('strip rejects normalized indices', async () => {
  const {payload, primitive} = cloneStrip();
  primitive.indices!.normalized = true;
  await expect(readResource(payload)).rejects.toMatchObject({
    code: 'MESH_ATTRIBUTE_LAYOUT_UNSUPPORTED'
  });
});

test.each([0, 1, 3])('source still rejects non-surface mode %s', async mode => {
  const {payload, primitive} = cloneStrip();
  primitive.mode = mode;
  await expect(readResource(payload)).rejects.toMatchObject({code: 'MESH_TOPOLOGY_UNSUPPORTED'});
});

test('multi-feature strip retains visible ownership and first-corner rows for degenerate connectors', async () => {
  const {payload, primitive} = cloneStrip();
  primitive.indices!.value = new Uint16Array([0, 1, 2, 2, 3, 3, 4, 5]);
  primitive.attributes._BATCHID = {
    ...primitive.indices!,
    value: new Uint8Array([0, 0, 0, 1, 1, 1]),
    count: 6
  };
  payload.header = {...payload.header, batchLength: 2};
  payload.batchTableJson = {
    source_id: ['9007199254740993', '18446744073709551615'],
    label: ['first', 'second']
  };
  const base = await createSource(payload);
  // Attach an explicit schema to a fresh adapter on the same runtime; no type inference.
  const source = createMeshTilesetConversionSource(runtimes.at(-1)!, {
    features: {
      metadataClass: 'surface',
      sourceFeatureIdProperty: 'source_id',
      featureIdField: 'source_id',
      schema: {
        fields: [
          {name: 'source_id', type: 'utf8', nullable: false},
          {name: 'label', type: 'utf8', nullable: false}
        ]
      }
    }
  });
  const resources: MeshSourceResource[] = [];
  for await (const resource of source.read(await base.inspect())) {
    resources.push(resource);
    expect(resource.features!.triangleFeatureIndices).toEqual(new Uint32Array([0, 0, 0, 0, 1, 1]));
    expect(resource.features!.batches[0].data.getChild('source_id')!.get(0)).toBe(
      '9007199254740993'
    );
  }
  expect(resources).toHaveLength(1);
  const output = encodeI3SMeshLayer(resources[0].mesh, {
    maxPositionError: 0.001,
    maxResourceBytes: 16384,
    features: resources[0].features
  });
  const geometry = new DataView(
    new GZipCompression().decompressSync(output.files['nodes/1/geometries/0.bin.gz'])
  );
  expect(geometry.getUint32(0, true)).toBe(18);
  expect(geometry.getUint32(4, true)).toBe(2);
});

test.each([false, true])('expanded strip has valid GLB output with draco=%s', async draco => {
  const resource = await readResource(fixtures.get('strip-16')!);
  const codec = createMeshConversionCodec({
    spatialContext: createSpatialContext({
      sourceCrs: 'EPSG:4978',
      coordinateFrame: 'geocentric',
      heightReference: 'ellipsoidal'
    }),
    maxPositionError: 0,
    draco,
    dracoLibraryOptions: {useLocalLibraries: true}
  });
  for await (const output of codec.convert(resource, undefined)) {
    const validation = await validateBytes(new Uint8Array(output.glb), {writeTimestamp: false});
    expect(validation.issues.numErrors).toBe(0);
    expect(validation.issues.numWarnings).toBe(0);
    const decoded = postProcessGLTF(
      await parse(output.glb, GLTFLoader, {
        core: {worker: false, useLocalLibraries: true},
        gltf: {decompressMeshes: true, loadImages: false}
      })
    );
    const primitive = decoded.meshes![0].primitives[0];
    expect(primitive.indices!.value).toHaveLength(12);
    // Each triangle retains +Z winding, including the odd strip triangles.
    const values = primitive.attributes.POSITION.value;
    for (let triangle = 0; triangle < 4; triangle++) {
      const [first, second, third] = Array.from(
        primitive.indices!.value.slice(triangle * 3, triangle * 3 + 3),
        Number
      );
      const signedArea =
        (Number(values[second * 3]) - Number(values[first * 3])) *
          (Number(values[third * 3 + 1]) - Number(values[first * 3 + 1])) -
        (Number(values[second * 3 + 1]) - Number(values[first * 3 + 1])) *
          (Number(values[third * 3]) - Number(values[first * 3]));
      expect(signedArea).toBe(1);
    }
  }
});

test('expanded strip enters the raw I3S writer as four triangles', async () => {
  const resource = await readResource(fixtures.get('strip-nonindexed')!);
  const codec = createI3SMeshConversionCodec({
    spatialContext: createSpatialContext({
      sourceCrs: 'EPSG:4978',
      coordinateFrame: 'geocentric',
      heightReference: 'ellipsoidal'
    }),
    maxPositionError: 0.001,
    maxResourceBytes: 16384,
    draco: false
  });
  for await (const output of codec.convert(resource, undefined)) {
    const nodePage = JSON.parse(
      new TextDecoder().decode(
        new GZipCompression().decompressSync(output.files['nodepages/0.json.gz'])
      )
    );
    expect(nodePage.nodes[1].mesh.geometry).toMatchObject({vertexCount: 12});
  }
});
