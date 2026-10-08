// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeAll, expect, test, vi} from 'vitest';
import {parse} from '@loaders.gl/core';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {GLTFScenegraph, GLTFWriter, type GLTFPostprocessed} from '@loaders.gl/gltf';
import {Tiles3DSource, Tileset3D} from '@loaders.gl/tiles';
import {DataViewReadableFile} from '@loaders.gl/zip';
import {parseSLPKArchive} from '@loaders.gl/i3s';
import {Matrix4} from '@math.gl/core';
import {
  convertTileset,
  createMeshTilesetConversionSource,
  createI3SMeshConversionCodec,
  createSingleMeshI3SSink,
  createTileConversionArchive,
  createMeshConversionCodec,
  createTiles3DConversionSpatialContext,
  convertFeatureAttributesToArrowBatches,
  type MeshSourceFeatureOptions
} from '@loaders.gl/tile-converter/v5';
import {
  createMeshTilesetConversionSource as browserSource,
  createI3SMeshConversionCodec as browserCodec,
  createSingleMeshI3SSink as browserSink
} from '@loaders.gl/tile-converter/v5/browser';

/** Builds a real tiny GLB, optionally carrying decoded structural or legacy feature metadata. */
function createGlb(modern = false): ArrayBuffer {
  const scenegraph = new GLTFScenegraph({json: {asset: {version: '2.0'}}});
  const attributes: any = {
    POSITION: {
      value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 2, 1, 0, 2, 0, 1, 2]),
      size: 3
    },
    NORMAL: {
      value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]),
      size: 3
    }
  };
  if (modern) attributes._FEATURE_ID_0 = {value: new Uint16Array([1, 1, 1, 0, 0, 0]), size: 1};
  const mesh = scenegraph.addMesh({
    attributes,
    indices: new Uint16Array([0, 1, 2, 3, 4, 5]),
    material: scenegraph.addMaterial({
      pbrMetallicRoughness: {
        baseColorFactor: [0.2, 0.4, 0.6, 1],
        metallicFactor: 0,
        roughnessFactor: 1
      }
    })
  });
  const node = scenegraph.addNode({
    meshIndex: mesh,
    matrix: Array.from(new Matrix4().translate([2, 3, 4]).scale([2, 3, 4]))
  });
  scenegraph.setDefaultScene(scenegraph.addScene({nodeIndices: [node]}));
  if (modern) {
    const ids = new ArrayBuffer(16);
    const view = new DataView(ids);
    view.setBigUint64(0, 9007199254740993n, true);
    view.setBigUint64(8, 18446744073709551615n, true);
    const values = scenegraph.addBufferView(ids);
    const strings = scenegraph.addBufferView(new TextEncoder().encode('firstsecond').buffer);
    const offsets = scenegraph.addBufferView(new Uint32Array([0, 5, 11]));
    scenegraph.json.extensions = {
      EXT_structural_metadata: {
        schema: {
          id: 'schema',
          classes: {
            building: {
              properties: {
                source_id: {type: 'SCALAR', componentType: 'UINT64'},
                label: {type: 'STRING'}
              }
            }
          }
        },
        propertyTables: [
          {
            class: 'building',
            count: 2,
            properties: {source_id: {values}, label: {values: strings, stringOffsets: offsets}}
          }
        ]
      }
    };
    scenegraph.getMesh(mesh).primitives[0].extensions = {
      EXT_mesh_features: {featureIds: [{featureCount: 2, attribute: 0, propertyTable: 0}]}
    };
    scenegraph.registerRequiredExtension('EXT_structural_metadata');
    scenegraph.registerRequiredExtension('EXT_mesh_features');
  }
  scenegraph.createBinaryChunk();
  return GLTFWriter.encodeSync!(scenegraph.gltf);
}

/** Initializes a tiny source-backed runtime; resource bytes are parsed by the real 3D Tiles loader. */
async function createRuntime(modern = false, mutate?: (payload: any) => void, twoContents = false) {
  const boundingVolume = {sphere: [6378137, 0, 0, 100]};
  const source = new Tiles3DSource({
    shape: 'tileset3d',
    type: 'TILES3D',
    url: '/fixture/tileset.json',
    basePath: '/fixture',
    loader: Tiles3DLoader,
    asset: {version: '1.1'},
    lodMetricType: 'geometricError',
    lodMetricValue: 0,
    root: {
      id: 'root',
      boundingVolume: {region: [0, 0, 0.001, 0.001, 0, 100]},
      lodMetricType: 'geometricError',
      lodMetricValue: 0,
      refine: 'ADD',
      transform: Array.from(new Matrix4().translate([6378137, 10, 20])),
      children: [
        {
          id: 'leaf',
          boundingVolume,
          lodMetricType: 'geometricError',
          lodMetricValue: 0,
          refine: 'ADD',
          transform: Array.from(new Matrix4().translate([5, 6, 7])),
          contentUrls: twoContents ? ['mesh.glb', 'second.glb'] : ['mesh.glb'],
          content: twoContents ? [{uri: 'mesh.glb'}, {uri: 'second.glb'}] : {uri: 'mesh.glb'}
        }
      ]
    }
  });
  const payload: any = await parse(createGlb(modern), Tiles3DLoader, {
    '3d-tiles': {loadGLTF: true},
    gltf: {loadImages: false}
  });
  payload.rtcCenter = [1, 2, 3];
  mutate?.(payload);
  vi.spyOn(source, 'loadTileContent').mockImplementation(async () => ({
    loaded: true,
    contents: twoContents ? [payload, payload] : [payload]
  }));
  const runtime = new Tileset3D(source);
  await runtime.tilesetInitializationPromise;
  return {runtime, payload, source};
}
const SPATIAL = createTiles3DConversionSpatialContext({
  sourceCrs: 'EPSG:4978',
  coordinateFrame: 'geocentric',
  heightReference: 'ellipsoidal'
});
const FEATURES: MeshSourceFeatureOptions = {
  metadataClass: 'building',
  sourceFeatureIdProperty: 'source_id',
  featureIdField: 'source_id',
  integer64Encoding: 'decimal-string',
  schema: {
    fields: [
      {name: 'source_id', type: 'uint64', nullable: false},
      {name: 'label', type: 'utf8', nullable: false}
    ]
  }
};

/** Converts one tiny runtime to finalized I3S resources and indexed SLPK. */
async function convertRuntime(modern = false, features?: MeshSourceFeatureOptions, draco = true) {
  const {runtime, payload} = await createRuntime(modern);
  const source = createMeshTilesetConversionSource(runtime, {unloadContent: true, features});
  const sink = createSingleMeshI3SSink({maxTotalBytes: 16384});
  const report = await convertTileset({
    source,
    codec: createI3SMeshConversionCodec({
      spatialContext: SPATIAL,
      draco,
      dracoLibraryOptions: {useLocalLibraries: true},
      maxPositionError: 0.001,
      maxResourceBytes: 8192
    }),
    sink,
    measureInputBytes: resource => resource.mesh.attributes.POSITION.value.byteLength,
    measureOutputBytes: resource =>
      Object.values(resource.files).reduce((sum, buffer) => sum + buffer.byteLength, 0)
  });
  const archive = await createTileConversionArchive(sink.getFiles(), {
    format: 'slpk',
    maxArchiveBytes: 32768
  });
  const reader = await parseSLPKArchive(
    new DataViewReadableFile(new DataView(await archive.arrayBuffer()))
  );
  return {runtime, payload, sink, report, reader};
}
let converted: Awaited<ReturnType<typeof convertRuntime>>;
beforeAll(async () => {
  converted = await convertRuntime(true, FEATURES);
});

test('browser/root APIs agree and real source mesh conversion creates a readable SLPK with exact features', async () => {
  expect(browserSource).toBe(createMeshTilesetConversionSource);
  expect(browserCodec).toBe(createI3SMeshConversionCodec);
  expect(browserSink).toBe(createSingleMeshI3SSink);
  expect(converted.sink.getFiles().length).toBeGreaterThan(5);
  const layer = JSON.parse(new TextDecoder().decode(await converted.reader.getFile('', 'http')));
  expect(layer.layerType).toBe('3DObject');
  expect(layer.geometryDefinitions[0].geometryBuffers[0].compressedAttributes.encoding).toBe(
    'draco'
  );
  const geometry = await converted.reader.getFile('nodes/1/geometries/0', 'http');
  expect(new TextDecoder().decode(geometry.slice(0, 5))).toBe('DRACO');
  expect(new Uint8Array(geometry)[8]).toBe(1);
  expect(layer.description).toBe('Source feature metadata class: building');
  expect(layer.fields.map((field: any) => field.name)).toEqual(['OBJECTID', 'source_id', 'label']);
  const ids = new DataView(await converted.reader.getFile('nodes/1/attributes/f_1/0', 'http'));
  const offset = 16;
  const firstSize = ids.getUint32(8, true);
  const secondSize = ids.getUint32(12, true);
  expect(new TextDecoder().decode(new Uint8Array(ids.buffer, offset, firstSize - 1))).toBe(
    '9007199254740993'
  );
  expect(
    new TextDecoder().decode(new Uint8Array(ids.buffer, offset + firstSize, secondSize - 1))
  ).toBe('18446744073709551615');
  expect(
    converted.report.diagnostics.some(
      diagnostic => diagnostic.code === 'I3S_INTEGER_DECIMAL_STRING'
    )
  ).toBe(true);
  expect(converted.runtime.root!.children[0].content).toBeFalsy();
});

test('tile, RTC, axis and node transforms are applied once with Float64 positions and inverse-transpose normals', async () => {
  const {runtime, payload} = await createRuntime();
  const adapter = createMeshTilesetConversionSource(runtime);
  const resources = [];
  for await (const resource of adapter.read(await adapter.inspect())) resources.push(resource);
  expect(resources).toHaveLength(1);
  const resource = resources[0];
  expect(Array.from(resource.mesh.attributes.POSITION.value.slice(0, 6))).toEqual([
    6378145, 14, 33, 6378147, 14, 33
  ]);
  expect(Array.from(resource.mesh.attributes.NORMAL.value.slice(0, 3))).toEqual([0, -1, 0]);
  expect(
    Array.from(payload.gltf.meshes[0].primitives[0].attributes.POSITION.value.slice(0, 3))
  ).toEqual([0, 0, 0]);
  const sink = createSingleMeshI3SSink({maxTotalBytes: 16384});
  const positions = vi.fn(SPATIAL.transformPositions);
  const normals = vi.fn(SPATIAL.transformNormals);
  await convertTileset({
    source: {
      inspect: async () => undefined,
      async *read() {
        yield resource;
      }
    },
    codec: createI3SMeshConversionCodec({
      spatialContext: {...SPATIAL, transformPositions: positions, transformNormals: normals},
      dracoLibraryOptions: {useLocalLibraries: true},
      maxResourceBytes: 8192,
      maxPositionError: 0.001
    }),
    sink,
    measureInputBytes: () => 1,
    measureOutputBytes: () => 1
  });
  expect(positions).toHaveBeenCalledTimes(1);
  expect(normals).toHaveBeenCalledTimes(1);
});

test('legacy B3DM batch metadata follows the same explicit Arrow mapping with null strings', async () => {
  const {runtime} = await createRuntime(false, payload => {
    payload.type = 'b3dm';
    payload.header = {batchLength: 2};
    payload.batchTableJson = {
      source_id: [9007199254740993n, 18446744073709551615n],
      label: [null, '']
    };
    const primitive = payload.gltf.meshes[0].primitives[0];
    primitive.attributes._BATCHID = {components: 1, value: new Float32Array([1, 1, 1, 0, 0, 0])};
  });
  const source = createMeshTilesetConversionSource(runtime, {
    features: {
      ...FEATURES,
      schema: {fields: [FEATURES.schema.fields[0], {name: 'label', type: 'utf8', nullable: true}]}
    }
  });
  const resources = [];
  for await (const resource of source.read(await source.inspect())) resources.push(resource);
  expect(resources[0].features!.batches[0].data.getChild('label')!.get(0)).toBe(null);
  expect(resources[0].features!.batches[0].data.getChild('label')!.get(1)).toBe('');
  expect(resources[0].features!.triangleFeatureIndices).toEqual(new Uint32Array([1, 0]));
});

test('unannotated real source conversion succeeds; GLB codec preserves feature-bearing resources', async () => {
  const result = await convertRuntime();
  expect(result.sink.getFiles().length).toBeGreaterThan(5);
  const {runtime} = await createRuntime(true);
  const adapter = createMeshTilesetConversionSource(runtime, {features: FEATURES});
  const resource = (
    await adapter
      .read(await adapter.inspect())
      [Symbol.asyncIterator]()
      .next()
  ).value!;
  const codec = createMeshConversionCodec({
    spatialContext: SPATIAL,
    maxPositionError: 0.001,
    dracoLibraryOptions: {useLocalLibraries: true}
  });
  const output = await codec.convert(resource, undefined)[Symbol.asyncIterator]().next();
  const gltf = await parse(output.value.glb, (await import('@loaders.gl/gltf')).GLTFLoader, {
    core: {worker: false, useLocalLibraries: true},
    gltf: {loadImages: false}
  });
  expect(
    gltf.json.extensions.EXT_structural_metadata.propertyTables[0].properties.source_id.data
  ).toEqual(new BigUint64Array([9007199254740993n, 18446744073709551615n]));
});

test.each([
  ['animation', (payload: any) => (payload.gltf.animations = [{}])],
  ['skin', (payload: any) => (payload.gltf.skins = [{}])],
  ['scene extension', (payload: any) => (payload.gltf.extensions = {UNKNOWN: {}})],
  ['axis', (payload: any) => (payload.gltfUpAxis = 'INVALID')],
  ['RTC', (payload: any) => (payload.rtcCenter = [NaN, 0, 0])],
  [
    'no default scene',
    (payload: any) => {
      delete payload.gltf.scene;
      payload.gltf.scenes = [];
    }
  ],
  [
    'node extension',
    (payload: any) => (payload.gltf.scene.nodes[0].extensions = {EXT_mesh_gpu_instancing: {}})
  ],
  ['node skin', (payload: any) => (payload.gltf.scene.nodes[0].skin = {})],
  ['node weights', (payload: any) => (payload.gltf.scene.nodes[0].weights = [1])],
  [
    'cycle',
    (payload: any) => (payload.gltf.scene.nodes[0].children = [payload.gltf.scene.nodes[0]])
  ],
  ['mirror', (payload: any) => (payload.gltf.scene.nodes[0].matrix[0] = -1)],
  ['projective', (payload: any) => (payload.gltf.scene.nodes[0].matrix[3] = 1)],
  [
    'primitive extension',
    (payload: any) => (payload.gltf.meshes[0].primitives[0].extensions = {UNKNOWN: {}})
  ],
  ['morph', (payload: any) => (payload.gltf.meshes[0].primitives[0].targets = [{}])],
  ['empty primitive', (payload: any) => (payload.gltf.meshes[0].primitives = [])],
  [
    'texture',
    (payload: any) =>
      (payload.gltf.meshes[0].primitives[0].material.pbrMetallicRoughness.baseColorTexture = {})
  ],
  [
    'emissive',
    (payload: any) => (payload.gltf.meshes[0].primitives[0].material.emissiveFactor = [1, 0, 0])
  ],
  [
    'undeclared feature',
    (payload: any) =>
      (payload.gltf.meshes[0].primitives[0].attributes._FEATURE_ID_0 = {
        value: new Uint16Array(6),
        components: 1
      })
  ]
])('source extraction rejects unsupported %s', async (_name, mutate) => {
  const {runtime} = await createRuntime(false, mutate);
  const source = createMeshTilesetConversionSource(runtime);
  await expect(async () => {
    for await (const _resource of source.read(await source.inspect())) {
    }
  }).rejects.toThrow();
});

test.each([
  [
    'class',
    (payload: any) =>
      (payload.gltf.extensions.EXT_structural_metadata.propertyTables[0].class = 'other')
  ],
  [
    'table count',
    (payload: any) => (payload.gltf.extensions.EXT_structural_metadata.propertyTables[0].count = 3)
  ],
  [
    'texture IDs',
    (payload: any) =>
      (payload.gltf.meshes[0].primitives[0].extensions.EXT_mesh_features.featureIds[0].texture = {})
  ],
  [
    'null IDs',
    (payload: any) =>
      (payload.gltf.meshes[0].primitives[0].extensions.EXT_mesh_features.featureIds[0].nullFeatureId = 2)
  ],
  [
    'multiple sets',
    (payload: any) =>
      payload.gltf.meshes[0].primitives[0].extensions.EXT_mesh_features.featureIds.push({})
  ],
  [
    'row range',
    (payload: any) => (payload.gltf.meshes[0].primitives[0].attributes._FEATURE_ID_0.value[0] = 2)
  ],
  [
    'mixed triangle',
    (payload: any) => (payload.gltf.meshes[0].primitives[0].attributes._FEATURE_ID_0.value[0] = 0)
  ],
  [
    'undecoded property',
    (payload: any) =>
      delete payload.gltf.extensions.EXT_structural_metadata.propertyTables[0].properties.label.data
  ],
  [
    'missing class',
    (payload: any) => delete payload.gltf.extensions.EXT_structural_metadata.schema.classes
  ],
  [
    'second attribute',
    (payload: any) =>
      (payload.gltf.meshes[0].primitives[0].attributes._FEATURE_ID_1 = {
        value: new Uint16Array(6),
        components: 1
      })
  ]
])('feature extraction rejects unsupported %s', async (_name, mutate) => {
  const {runtime} = await createRuntime(true, mutate);
  const source = createMeshTilesetConversionSource(runtime, {features: FEATURES});
  await expect(async () => {
    for await (const _resource of source.read(await source.inspect())) {
    }
  }).rejects.toThrow();
});

test('feature-bearing sources require explicit mappings and valid source CRS', async () => {
  const {runtime, source} = await createRuntime(true);
  const adapter = createMeshTilesetConversionSource(runtime);
  await expect(async () => {
    for await (const _resource of adapter.read(await adapter.inspect())) {
    }
  }).rejects.toMatchObject({code: 'MESH_FEATURE_SCHEMA_REQUIRED'});
  source.getMetadata().spatialReference = {
    ...source.getMetadata().spatialReference!,
    status: 'transformed'
  };
  await expect(adapter.inspect()).rejects.toMatchObject({code: 'MESH_SOURCE_FRAME_UNSUPPORTED'});
});

test('single-layer sink hides partial files and aborts on a second mesh or byte limit', async () => {
  const {runtime} = await createRuntime(false, undefined, true);
  const source = createMeshTilesetConversionSource(runtime);
  const codec = createI3SMeshConversionCodec({
    spatialContext: SPATIAL,
    dracoLibraryOptions: {useLocalLibraries: true},
    maxResourceBytes: 8192,
    maxPositionError: 0.001
  });
  const sink = createSingleMeshI3SSink({maxTotalBytes: 16384});
  expect(sink.getFiles()).toEqual([]);
  await expect(
    convertTileset({source, codec, sink, measureInputBytes: () => 1, measureOutputBytes: () => 1})
  ).rejects.toMatchObject({code: 'SINGLE_I3S_MESH_UNAVAILABLE'});
  expect(sink.getFiles()).toEqual([]);
  const smallSink = createSingleMeshI3SSink({maxTotalBytes: 1});
  await expect(
    convertTileset({
      source,
      codec,
      sink: smallSink,
      measureInputBytes: () => 1,
      measureOutputBytes: () => 1
    })
  ).rejects.toThrow();
  expect(smallSink.getFiles()).toEqual([]);
  await expect(
    createSingleMeshI3SSink({maxTotalBytes: 100}).finalize({} as any)
  ).rejects.toMatchObject({code: 'SINGLE_I3S_MESH_INCOMPLETE'});
});

test('cancellation propagates and invalid spatial/precision policies fail explicitly', async () => {
  const {runtime} = await createRuntime();
  const controller = new AbortController();
  controller.abort();
  await expect(
    createMeshTilesetConversionSource(runtime).inspect(controller.signal)
  ).rejects.toThrow();
  expect(() =>
    createI3SMeshConversionCodec({
      spatialContext: createTiles3DConversionSpatialContext({
        sourceCrs: 'EPSG:4326',
        heightReference: 'ellipsoidal'
      }),
      maxResourceBytes: 8192,
      maxPositionError: 0.001
    })
  ).toThrow();
  const adapter = createMeshTilesetConversionSource(runtime);
  const resource = (
    await adapter
      .read(await adapter.inspect())
      [Symbol.asyncIterator]()
      .next()
  ).value!;
  const codec = createI3SMeshConversionCodec({
    spatialContext: SPATIAL,
    dracoLibraryOptions: {useLocalLibraries: true},
    maxResourceBytes: 1,
    maxPositionError: 0
  });
  await expect(async () => {
    for await (const _output of codec.convert(resource, undefined)) {
    }
  }).rejects.toMatchObject({code: 'I3S_MESH_PROFILE_UNSUPPORTED'});
});

test.each([
  'X',
  'Z'
])('source extraction supports declared %s up axis and scene fallback without material/normals', async axis => {
  const {runtime} = await createRuntime(false, payload => {
    payload.gltfUpAxis = axis;
    delete payload.rtcCenter;
    delete payload.gltf.scene;
    delete payload.gltf.meshes[0].primitives[0].material;
    delete payload.gltf.meshes[0].primitives[0].attributes.NORMAL;
    const node = payload.gltf.scenes[0].nodes[0];
    delete node.matrix;
    node.translation = [2, 3, 4];
    node.children = [{mesh: node.mesh}];
  });
  const adapter = createMeshTilesetConversionSource(runtime);
  const resources = [];
  for await (const resource of adapter.read(await adapter.inspect())) resources.push(resource);
  expect(resources).toHaveLength(2);
  const expected = axis === 'Z' ? [6378144, 19, 31] : [6378138, 19, 29];
  expect(Array.from(resources[0].mesh.attributes.POSITION.value.slice(0, 3))).toEqual(expected);
  expect(resources[0].material).toBeUndefined();
  expect(resources[0].mesh.attributes.NORMAL).toBeUndefined();
});

test('feature extraction expands declared defaults and rejects undeclared or malformed columns', async () => {
  const {runtime} = await createRuntime(true, payload => {
    const metadata = payload.gltf.extensions.EXT_structural_metadata;
    metadata.schema.classes.building.properties.label.default = 'default';
    delete metadata.propertyTables[0].properties.label;
  });
  const adapter = createMeshTilesetConversionSource(runtime, {features: FEATURES});
  for await (const resource of adapter.read(await adapter.inspect())) {
    expect(Array.from(resource.features!.batches[0].data.getChild('label')!)).toEqual([
      'default',
      'default'
    ]);
  }
  for (const mutate of [
    (payload: any) =>
      (payload.gltf.extensions.EXT_structural_metadata.propertyTables[0].properties.extra = {
        data: [0, 1]
      }),
    (payload: any) =>
      (payload.gltf.extensions.EXT_structural_metadata.propertyTables[0].properties.label.data =
        'ab'),
    (payload: any) => delete payload.gltf.meshes[0].primitives[0].attributes._FEATURE_ID_0
  ]) {
    const {runtime: invalid} = await createRuntime(true, mutate);
    const source = createMeshTilesetConversionSource(invalid, {features: FEATURES});
    await expect(async () => {
      for await (const _resource of source.read(await source.inspect())) {
      }
    }).rejects.toThrow();
  }
});

test('Arrow mapping rejects malformed Unicode before Arrow can replace it', () => {
  expect(() =>
    convertFeatureAttributesToArrowBatches(
      [{featureId: 'id', metadataClass: 'building', properties: {label: '\uD800'}}],
      {
        schema: {
          fields: [
            {name: 'feature_id', type: 'utf8', nullable: false},
            {name: 'label', type: 'utf8', nullable: false}
          ]
        }
      }
    )
  ).toThrow(/Unicode/);
});

test.each([
  'tile',
  'content',
  'frame'
])('source extraction rejects unmapped %s metadata', async scope => {
  const {runtime} = await createRuntime();
  const leaf = runtime.root!.children[0].header;
  if (scope === 'tile') leaf.metadata = {} as any;
  if (scope === 'frame')
    leaf._spatialReference = {...runtime.spatialReference!, status: 'transformed'};
  if (scope === 'content') runtime.root!.children[0].contentEntries[0].metadata = {};
  const adapter = createMeshTilesetConversionSource(runtime);
  await expect(async () => {
    for await (const _resource of adapter.read(await adapter.inspect())) {
    }
  }).rejects.toThrow();
});

test.each([
  'noData',
  'array',
  'enum',
  'integer64 transform'
])('feature extraction rejects unresolved %s semantics', async kind => {
  const {runtime} = await createRuntime(true, payload => {
    const properties =
      payload.gltf.extensions.EXT_structural_metadata.schema.classes.building.properties;
    if (kind === 'noData') properties.label.noData = 123;
    if (kind === 'array') properties.label.array = true;
    if (kind === 'enum') properties.label.type = 'ENUM';
    if (kind === 'integer64 transform') properties.source_id.scale = 2;
  });
  const source = createMeshTilesetConversionSource(runtime, {features: FEATURES});
  await expect(async () => {
    for await (const _resource of source.read(await source.inspect())) {
    }
  }).rejects.toMatchObject({code: 'MESH_FEATURE_PROPERTY_UNSUPPORTED'});
});

test('the I3S codec raw opt-out retains a readable raw geometry resource', async () => {
  const result = await convertRuntime(false, undefined, false);
  try {
    const layer = JSON.parse(new TextDecoder().decode(await result.reader.getFile('', 'http')));
    expect(layer.geometryDefinitions[0].geometryBuffers[0].compressedAttributes).toBeUndefined();
    const geometry = new DataView(await result.reader.getFile('nodes/1/geometries/0', 'http'));
    expect(geometry.getUint32(0, true)).toBe(6);
    expect(geometry.getUint32(4, true)).toBe(1);
  } finally {
    result.runtime.destroy();
  }
});
