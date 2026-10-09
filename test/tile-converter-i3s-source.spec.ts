// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {validateBytes} from 'gltf-validator';
import {GZipDecompressor} from '@loaders.gl/compression/gzip-decompressor';
import {parse} from '@loaders.gl/core';
import {
  I3SLoader,
  I3SContentLoader,
  I3SAttributeLoader,
  type I3STileContent
} from '@loaders.gl/i3s';
import {I3SSource, Tileset3D} from '@loaders.gl/tiles';
import type {Tileset3D as TilesetRuntime, TilesetSourceMetadata} from '@loaders.gl/tiles';
import {createTilesetSpatialReference} from '@loaders.gl/tiles';
import {GLTFLoader} from '@loaders.gl/gltf/bundled';
import {GLTFScenegraph} from '@loaders.gl/gltf';
import {Matrix4} from '@math.gl/core';
import {ArrowTableBuilder} from '@loaders.gl/schema-utils';
import {
  createI3SMeshTilesetConversionSource,
  createI3SConversionSpatialContext,
  createI3SMeshConversionCodec,
  createMeshConversionCodec,
  createSingleMeshTilesetSink,
  convertTileset
} from '@loaders.gl/tile-converter/v5';
import {createI3SMeshTilesetConversionSource as browserSource} from '@loaders.gl/tile-converter/v5/browser';

/** Two fixture shapes: original projected positions and no source feature attributes. */
function createContent(): I3STileContent {
  const sourceAttributes = {
    position: {
      value: new Float64Array([0, 0, 100.000001, 1, 0, 100.000001, 0, 1, 100.000001]),
      size: 3
    },
    normal: {value: new Float32Array([1, 0, 0, 1, 0, 0, 1, 0, 0]), size: 3}
  };
  return {
    geometryMode: 'source',
    normalReferenceFrame: 'earth-centered',
    sourceAttributes,
    attributes: {positions: sourceAttributes.position, normals: sourceAttributes.normal},
    indices: null,
    featureIds: [],
    vertexCount: 3,
    byteLength: 80,
    topology: 'triangle-list',
    coordinateSystem: 'cartesian',
    origin: [0, 0, 0],
    modelMatrix: new Matrix4(),
    texture: null,
    spatialReference: createTilesetSpatialReference({
      sourceCrs: 'EPSG:3857',
      heightReference: 'ellipsoidal'
    }),
    material: {
      pbrMetallicRoughness: {baseColorFactor: [0.5, 0.25, 0.75, 1], baseColorTexture: undefined},
      normalTexture: undefined
    }
  };
}
/** Dedicated preloaded runtime shape; shared traversal owns cleanup on success or interruption. */
function createRuntime(content = createContent()) {
  const unload = vi.fn(() => {
    root.content = null;
    root.contentEntries = [];
  });
  const root: any = {
    id: 'root',
    header: {},
    children: [],
    contentUrls: ['geometry'],
    content: null,
    contentEntries: [],
    unloadContent: unload
  };
  root.loadContentForTraversal = async () => {
    root.content = content;
    root.contentEntries = [{index: 0, payload: content}];
    return {loaded: true};
  };
  const metadata: TilesetSourceMetadata = {
    type: 'I3S' as any,
    loader: I3SLoader,
    url: '/layer',
    basePath: '/',
    tileset: {layerType: '3DObject'},
    lodMetricType: 'maxScreenThresholdSQ',
    lodMetricValue: 4,
    refine: 'REPLACE',
    spatialReference: content.spatialReference
  };
  const runtime = {
    root,
    type: 'I3S',
    options: {i3s: {geometryMode: 'source'}},
    tilesetInitializationPromise: Promise.resolve(),
    source: {getMetadata: () => metadata}
  } as unknown as TilesetRuntime;
  return {runtime, root, metadata, unload};
}
/** Explicit Arrow table and triangle association, preserving a stable source identifier. */
function createFeatures() {
  const builder = new ArrowTableBuilder({
    fields: [{name: 'feature_id', type: 'uint64', nullable: false}]
  });
  builder.addObjectRow({feature_id: 7n});
  return {
    batches: [builder.finishBatch()!],
    triangleFeatureIndices: new Uint32Array([0]),
    featureIdField: 'feature_id'
  };
}

test('I3S source converts original projected geometry through GLB with target-centered precision', async () => {
  expect(browserSource).toBe(createI3SMeshTilesetConversionSource);
  const {runtime, unload} = createRuntime();
  const source = createI3SMeshTilesetConversionSource(runtime, {unloadContent: true});
  const metadata = await source.inspect();
  const spatialContext = createI3SConversionSpatialContext(metadata.spatialReference!, {
    targetCrs: 'EPSG:4978'
  });
  const sink = createSingleMeshTilesetSink({geometricError: 0.001, maxTotalBytes: 32768});
  const report = await convertTileset({
    source,
    codec: createMeshConversionCodec({
      spatialContext,
      autoOrigin: true,
      draco: false,
      maxPositionError: 0.001
    }),
    sink,
    measureInputBytes: resource => resource.mesh.attributes.POSITION.value.byteLength,
    measureOutputBytes: resource => resource.glb.byteLength
  });
  expect(report.state).toBe('completed');
  expect(report.outputResources).toBe(1);
  expect(unload).toHaveBeenCalledOnce();
  const files = sink.getFiles();
  const parsed = await parse(
    await files.find(file => file.resourceId.endsWith('.glb'))!.blob.arrayBuffer(),
    GLTFLoader,
    {worker: false}
  );
  const scenegraph = new GLTFScenegraph(parsed);
  const primitive = scenegraph.json.meshes![0].primitives[0];
  const positions = scenegraph.getTypedArrayForAccessor(primitive.attributes.POSITION);
  expect(Math.max(...Array.from(positions, Math.abs))).toBeLessThan(1);
  expect(primitive.material).toBeDefined();
  const tileset = JSON.parse(
    await files.find(file => file.resourceId.endsWith('.json'))!.blob.text()
  );
  expect(tileset.root.transform[12]).toBeCloseTo(6378237.000001, 5);
});

test('feature data needs a complete explicit mapper and unsafe numeric identifiers fail', async () => {
  const content = createContent();
  content.featureIds = [7, 7, 7];
  const {runtime} = createRuntime(content);
  const missing = createI3SMeshTilesetConversionSource(runtime);
  await expect(
    missing
      .read(await missing.inspect())
      [Symbol.asyncIterator]()
      .next()
  ).rejects.toMatchObject({code: 'I3S_MESH_SOURCE_FEATURE_MAPPING_REQUIRED'});
  const mapper = vi.fn(createFeatures);
  const source = createI3SMeshTilesetConversionSource(runtime, {getFeatures: mapper});
  const iterator = source.read(await source.inspect())[Symbol.asyncIterator]();
  const resource = (await iterator.next()).value!;
  await iterator.return?.();
  expect(resource.features!.batches[0].data.getChild('feature_id')!.get(0)).toBe(7n);
  expect(mapper).toHaveBeenCalledOnce();
  content.featureIds = [9007199254740992];
  await expect(
    source
      .read(await source.inspect())
      [Symbol.asyncIterator]()
      .next()
  ).rejects.toMatchObject({code: 'I3S_MESH_SOURCE_FEATURE_ID_UNSUPPORTED'});
});

test('declared feature fields and cancellation cannot produce an incomplete resource', async () => {
  const {runtime, metadata, unload} = createRuntime();
  metadata.tileset.fields = [{name: 'feature_id'}];
  const missing = createI3SMeshTilesetConversionSource(runtime, {
    unloadContent: true,
    getFeatures: async () => undefined as any
  });
  await expect(
    missing
      .read(await missing.inspect())
      [Symbol.asyncIterator]()
      .next()
  ).rejects.toMatchObject({code: 'I3S_MESH_SOURCE_FEATURE_MAPPING_REQUIRED'});
  const controller = new AbortController();
  const cancelled = createI3SMeshTilesetConversionSource(runtime, {
    unloadContent: true,
    getFeatures: async () => {
      controller.abort();
      return createFeatures();
    }
  });
  await expect(
    cancelled
      .read(await cancelled.inspect(), controller.signal)
      [Symbol.asyncIterator]()
      .next()
  ).rejects.toMatchObject({name: 'AbortError'});
  expect(unload).toHaveBeenCalledTimes(2);
});

test.each([
  {
    change: (content: any) => {
      content.geometryMode = 'render';
    },
    code: 'I3S_MESH_SOURCE_GEOMETRY_UNSUPPORTED'
  },
  {
    change: (content: any) => {
      content.topology = 'point-list';
    },
    code: 'I3S_MESH_SOURCE_GEOMETRY_UNSUPPORTED'
  },
  {
    change: (content: any) => {
      content.sourceAttributes = undefined;
    },
    code: 'I3S_MESH_SOURCE_GEOMETRY_UNSUPPORTED'
  },
  {
    change: (content: any) => {
      content.normalReferenceFrame = 'unknown';
    },
    code: 'I3S_MESH_SOURCE_NORMAL_FRAME_UNSUPPORTED'
  },
  {
    change: (content: any) => {
      content.sourceAttributes.color = {value: new Uint8Array(12), size: 4};
    },
    code: 'I3S_MESH_SOURCE_ATTRIBUTE_UNSUPPORTED'
  },
  {
    change: (content: any) => {
      content.meshSegmentation = new ArrayBuffer(0);
    },
    code: 'I3S_MESH_SOURCE_ATTRIBUTE_UNSUPPORTED'
  },
  {
    change: (content: any) => {
      content.texture = new ArrayBuffer(1);
    },
    code: 'I3S_MESH_SOURCE_TEXTURE_UNSUPPORTED'
  },
  {
    change: (content: any) => {
      content.vertexCount = 4;
    },
    code: 'I3S_MESH_SOURCE_COUNT_INVALID'
  },
  {
    change: (content: any) => {
      content.material.cullFace = 'front';
    },
    code: 'I3S_MESH_SOURCE_MATERIAL_UNSUPPORTED'
  }
])('unsupported I3S source profiles fail with $code and release content', async ({
  change,
  code
}) => {
  const content = createContent();
  change(content);
  const {runtime, unload} = createRuntime(content);
  const source = createI3SMeshTilesetConversionSource(runtime, {unloadContent: true});
  await expect(
    source
      .read(await source.inspect())
      [Symbol.asyncIterator]()
      .next()
  ).rejects.toMatchObject({code});
  expect(unload).toHaveBeenCalledOnce();
});

test('source inspection rejects other layers, renderer decode policy, and missing CRS', async () => {
  for (const variant of ['type', 'layer', 'mode', 'crs']) {
    const {runtime, metadata} = createRuntime();
    if (variant === 'type') metadata.type = 'TILES3D' as any;
    if (variant === 'layer') metadata.tileset.layerType = 'PointCloud';
    if (variant === 'mode') runtime.options.i3s.geometryMode = 'render';
    if (variant === 'crs') metadata.spatialReference = undefined;
    await expect(createI3SMeshTilesetConversionSource(runtime).inspect()).rejects.toMatchObject({
      code:
        variant === 'crs'
          ? 'I3S_MESH_SOURCE_REFERENCE_REQUIRED'
          : 'I3S_MESH_SOURCE_PROFILE_UNSUPPORTED'
    });
  }
});

test('source geometry mode is propagated through a real I3S runtime and public content loader', async () => {
  const buffer = new ArrayBuffer(80);
  new DataView(buffer).setUint32(0, 3, true);
  new Float32Array(buffer, 8, 9).set([0, 0, 0, 1, 0, 0, 0, 1, 0]);
  new Float32Array(buffer, 44, 9).set([1, 0, 0, 1, 0, 0, 1, 0, 0]);
  const source = new I3SSource({
    type: 'I3S',
    fullExtent: {xmin: 0, ymin: 0, xmax: 1, ymax: 1, zmin: 100, zmax: 101},
    url: 'https://fixture/layers/0',
    loader: I3SLoader,
    layerType: '3DObject',
    spatialReference: {wkid: 3857},
    heightModelInfo: {heightModel: 'ellipsoidal', heightUnit: 'meter'},
    root: {
      id: 'root',
      lodMetricType: 'maxScreenThresholdSQ',
      lodMetricValue: 4,
      mbs: [0, 0, 100.000001, 1],
      boundingVolume: {sphere: [0, 0, 100, 1]},
      contentUrl: 'https://fixture/geometry',
      children: [],
      refine: 'REPLACE',
      layerType: '3DObject'
    },
    lodMetricType: 'maxScreenThresholdSQ',
    lodMetricValue: 4,
    store: {
      normalReferenceFrame: 'earth-centered',
      defaultGeometrySchema: {
        header: [
          {property: 'vertexCount', type: 'UInt32'},
          {property: 'featureCount', type: 'UInt32'}
        ],
        ordering: ['position', 'normal'],
        vertexAttributes: {
          position: {valueType: 'Float32', valuesPerElement: 3},
          normal: {valueType: 'Float32', valuesPerElement: 3}
        },
        featureAttributeOrder: [],
        featureAttributes: {}
      }
    },
    resolver: {
      loadRoot: async () => {
        throw new Error('unexpected root read');
      },
      loadResource: async (_url: string, loader: any, options: any) => {
        expect(loader.id).toBe(I3SContentLoader.id);
        return await parse(buffer, loader, {...options, core: {worker: false}});
      }
    }
  } as any);
  const runtime = new Tileset3D(source, {i3s: {geometryMode: 'source'}});
  try {
    const adapter = createI3SMeshTilesetConversionSource(runtime, {unloadContent: true});
    const iterator = adapter.read(await adapter.inspect())[Symbol.asyncIterator]();
    const resource = (await iterator.next()).value!;
    await iterator.return?.();
    expect(resource.mesh.attributes.POSITION.value).toBeInstanceOf(Float64Array);
    expect(resource.mesh.attributes.POSITION.value[2]).toBe(100.000001);
  } finally {
    runtime.destroy();
  }
});

test('source nodes must retain the layer units and original normal basis', async () => {
  for (const mismatch of ['units', 'normals']) {
    const content = createContent();
    const {runtime, metadata} = createRuntime(content);
    if (mismatch === 'units')
      content.spatialReference = {...metadata.spatialReference!, verticalUnitScale: 0.3048};
    else content.normalReferenceFrame = 'vertex-reference-frame';
    const source = createI3SMeshTilesetConversionSource(runtime);
    await expect(
      source
        .read(await source.inspect())
        [Symbol.asyncIterator]()
        .next()
    ).rejects.toMatchObject({
      code:
        mismatch === 'units'
          ? 'I3S_MESH_SOURCE_GEOMETRY_UNSUPPORTED'
          : 'I3S_MESH_SOURCE_NORMAL_FRAME_UNSUPPORTED'
    });
  }
});

test.each([
  'glb',
  'i3s'
] as const)('the %s codec consumes the source normal basis automatically', async format => {
  const content = createContent();
  content.normalReferenceFrame = 'vertex-reference-frame';
  const {runtime, metadata} = createRuntime(content);
  metadata.tileset.store = {normalReferenceFrame: 'vertex-reference-frame'};
  const source = createI3SMeshTilesetConversionSource(runtime);
  const iterator = source.read(await source.inspect())[Symbol.asyncIterator]();
  const resource = (await iterator.next()).value!;
  await iterator.return?.();
  expect(resource.normalReferenceFrame).toBe('vertex-reference-frame');
  const spatialContext = createI3SConversionSpatialContext(metadata.spatialReference!, {
    targetCrs: 'EPSG:4978'
  });
  const transform = vi.spyOn(spatialContext, 'transformGeometryAsync');
  const codec =
    format === 'glb'
      ? createMeshConversionCodec({
          spatialContext,
          autoOrigin: true,
          draco: false,
          maxPositionError: 0.01
        })
      : createI3SMeshConversionCodec({
          spatialContext,
          draco: false,
          name: 'fixture',
          maxPositionError: 0.01,
          maxResourceBytes: 32768
        });
  for await (const output of codec.convert(resource, metadata)) expect(output).toBeDefined();
  expect(transform).toHaveBeenCalledWith(
    expect.anything(),
    expect.anything(),
    'vertex-reference-frame'
  );
});

/** One-pixel PNG encoded bytes; no decoder or public service is needed. */
function createTextureContent() {
  const content = createContent();
  content.sourceAttributes!.uv0 = {value: new Float32Array([0, 0, 1, 0, 0, 1]), size: 2};
  const data = Uint8Array.from(
    atob(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1cAAAAASUVORK5CYII='
    ),
    character => character.charCodeAt(0)
  );
  content.material!.pbrMetallicRoughness.baseColorTexture = {
    textureSetDefinitionId: 2,
    wrapS: 'mirror',
    wrapT: 'none',
    texCoord: 0,
    texture: {source: {image: data.buffer}}
  };
  return {content, data};
}

/** Reads exactly one source resource and closes the traversal on success. */
async function readResource(source: ReturnType<typeof createI3SMeshTilesetConversionSource>) {
  const iterator = source.read(await source.inspect())[Symbol.asyncIterator]();
  const resource = (await iterator.next()).value!;
  await iterator.return?.();
  return resource;
}

test.each([
  'loaded',
  'reader',
  'legacy'
] as const)('I3S encoded base-color mapping preserves bytes and sampling through %s', async profile => {
  const {content, data} = createTextureContent();
  const {runtime, root, unload} = createRuntime(content);
  root.header.textureUrls = [
    {textureSetDefinitionId: 2, textureUrl: 'texture.png', textureFormat: 'png'}
  ];
  const reader = vi.fn(async () => {
    const padded = new Uint8Array(data.length + 4);
    padded.set(data, 2);
    return padded.subarray(2, -2);
  });
  if (profile === 'loaded') content.textures = {'2': data.buffer};
  else delete content.material!.pbrMetallicRoughness.baseColorTexture.texture;
  if (profile === 'legacy') {
    delete content.material!.pbrMetallicRoughness.baseColorTexture;
    delete root.header.textureUrls;
    root.header.textureUrl = 'texture.png';
    root.header.textureFormat = 'png';
  }
  const snapshot = structuredClone(content.material);
  const resource = await readResource(
    createI3SMeshTilesetConversionSource(runtime, {
      unloadContent: true,
      readExternalResource: reader
    })
  );
  expect(resource.material!.baseColorTexture!.data).toEqual(data);
  expect(resource.material!.baseColorTexture!.sampler).toEqual(
    profile === 'legacy' ? undefined : {wrapS: 33648, wrapT: 33071}
  );
  expect(content.material).toEqual(snapshot);
  expect(reader).toHaveBeenCalledTimes(profile === 'loaded' ? 0 : 1);
  expect(unload).toHaveBeenCalledOnce();
});

test.each([
  [
    'other map',
    (content: any) => {
      content.material.normalTexture = {textureSetDefinitionId: 2};
    },
    'MESH_SOURCE_MATERIAL_UNSUPPORTED'
  ],
  [
    'other UV',
    (content: any) => {
      content.material.pbrMetallicRoughness.baseColorTexture.texCoord = 1;
    },
    'I3S_MESH_SOURCE_TEXTURE_UNSUPPORTED'
  ],
  [
    'unknown wrapping',
    (content: any) => {
      content.material.pbrMetallicRoughness.baseColorTexture.wrapS = 'unknown';
    },
    'I3S_MESH_SOURCE_TEXTURE_UNSUPPORTED'
  ],
  [
    'transform',
    (content: any) => {
      content.material.pbrMetallicRoughness.baseColorTexture.offset = [1, 1];
    },
    'I3S_MESH_SOURCE_TEXTURE_UNSUPPORTED'
  ],
  [
    'missing UV',
    (content: any) => {
      delete content.sourceAttributes.uv0;
    },
    'MESH_TEXCOORD_REQUIRED'
  ],
  [
    'decoded pixels',
    (content: any) => {
      content.material.pbrMetallicRoughness.baseColorTexture.texture.source.image = {
        width: 1,
        height: 1
      };
    },
    'I3S_MESH_SOURCE_TEXTURE_UNSUPPORTED'
  ],
  [
    'extra set',
    (content: any) => {
      content.textures = {'3': new ArrayBuffer(1)};
    },
    'I3S_MESH_SOURCE_TEXTURE_UNSUPPORTED'
  ],
  [
    'malformed bytes',
    (content: any) => {
      content.material.pbrMetallicRoughness.baseColorTexture.texture.source.image = new Uint8Array(
        1
      );
    },
    'I3S_MESH_SOURCE_TEXTURE_UNSUPPORTED'
  ]
])('I3S texture %s fails explicitly and releases content', async (_name, change, code) => {
  const {content} = createTextureContent();
  change(content);
  const {runtime, unload} = createRuntime(content);
  await expect(
    readResource(createI3SMeshTilesetConversionSource(runtime, {unloadContent: true}))
  ).rejects.toMatchObject({code});
  expect(unload).toHaveBeenCalledOnce();
});

test('declared texture set/format mismatch, missing reader and reader cancellation cannot yield a mesh', async () => {
  for (const variant of ['set', 'format', 'reader', 'cancel']) {
    const {content, data} = createTextureContent();
    delete content.material!.pbrMetallicRoughness.baseColorTexture.texture;
    const {runtime, root, unload} = createRuntime(content);
    root.header.textureUrls = [
      {
        textureSetDefinitionId: variant === 'set' ? 3 : 2,
        textureFormat: variant === 'format' ? 'jpg' : 'png',
        textureUrl: 'texture'
      }
    ];
    const controller = new AbortController();
    const source = createI3SMeshTilesetConversionSource(runtime, {
      unloadContent: true,
      readExternalResource:
        variant === 'reader'
          ? undefined
          : async () => {
              if (variant === 'cancel') controller.abort();
              return data;
            }
    });
    await expect(
      source
        .read(await source.inspect(), controller.signal)
        [Symbol.asyncIterator]()
        .next()
    ).rejects.toMatchObject(
      variant === 'cancel' ? {name: 'AbortError'} : {code: 'I3S_MESH_SOURCE_TEXTURE_UNSUPPORTED'}
    );
    expect(unload).toHaveBeenCalledOnce();
  }
});

/** Independently encodes scalar resources, with attribute rows ordered differently from triangles. */
function createAttributeRuntime() {
  const content = createContent();
  const positions = content.sourceAttributes!.position.value;
  content.sourceAttributes!.position.value = new Float64Array([...positions, ...positions]);
  content.sourceAttributes!.normal.value = new Float32Array([
    ...content.sourceAttributes!.normal.value,
    ...content.sourceAttributes!.normal.value
  ]);
  content.vertexCount = 6;
  content.featureIds = new Uint32Array([12, 12, 12, 7, 7, 7]);
  content.sourceAttributes!.id = {value: content.featureIds, size: 1};
  const setup = createRuntime(content);
  const types = ['Oid32', 'UInt64', 'String', 'Int32'];
  const names = ['OBJECTID', 'stable_id', 'label', 'value'];
  setup.metadata.tileset.attributeStorageInfo = types.map((valueType, index) => ({
    key: `f_${index}`,
    name: names[index],
    header: [
      {property: 'count', valueType: 'UInt32'},
      ...(valueType === 'String'
        ? [{property: 'attributeValuesByteCount', valueType: 'UInt32'}]
        : [])
    ],
    ordering:
      valueType === 'String' ? ['attributeByteCounts', 'attributeValues'] : ['attributeValues'],
    ...(valueType === 'String'
      ? {attributeByteCounts: {valueType: 'UInt32', valuesPerElement: 1}}
      : {}),
    attributeValues: {
      valueType,
      valuesPerElement: 1,
      ...(valueType === 'String' ? {encoding: 'UTF-8'} : {})
    }
  }));
  setup.root.header.attributeUrls = names;
  const integers = new ArrayBuffer(12);
  new DataView(integers).setUint32(0, 2, true);
  new Uint32Array(integers, 4).set([7, 12]);
  const stable = new ArrayBuffer(24);
  new DataView(stable).setUint32(0, 2, true);
  new DataView(stable).setBigUint64(8, 9007199254740993n, true);
  new DataView(stable).setBigUint64(16, 18446744073709551615n, true);
  const text = new TextEncoder().encode('東京\0');
  const strings = new Uint8Array(16 + text.length);
  const stringView = new DataView(strings.buffer);
  stringView.setUint32(0, 2, true);
  stringView.setUint32(4, text.length, true);
  stringView.setUint32(8, text.length, true);
  // Row one is null (zero byte count); UTF-8 is neither trimmed nor stringified.
  strings.set(text, 16);
  const values = new ArrayBuffer(12);
  new DataView(values).setUint32(0, 2, true);
  new Int32Array(values, 4).set([-1, 42]);
  const resources: Record<string, Uint8Array> = {
    OBJECTID: new Uint8Array(integers),
    stable_id: new Uint8Array(stable),
    label: strings,
    value: new Uint8Array(values)
  };
  const features = {
    metadataClass: 'buildings',
    objectIdProperty: 'OBJECTID',
    sourceFeatureIdProperty: 'stable_id',
    maxAttributeBytes: 256,
    schema: {
      fields: [
        {name: 'feature_id', type: 'uint64' as const, nullable: false},
        {name: 'label', type: 'utf8' as const, nullable: true},
        {name: 'value', type: 'int32' as const, nullable: false}
      ]
    }
  };
  const reader = vi.fn(async (uri: string) => {
    const bytes = resources[uri];
    const padded = new Uint8Array(bytes.length + 8);
    padded.set(bytes, 4);
    return padded.subarray(4, -4);
  });
  return {...setup, content, resources, features, reader};
}

test('I3S attribute resources map exact bigint stable IDs, Unicode/nulls and reordered ownership into bounded Arrow batches', async () => {
  const {runtime, content, features, reader, unload} = createAttributeRuntime();
  const resource = await readResource(
    createI3SMeshTilesetConversionSource(runtime, {
      features: {...features, batchSize: 1},
      readExternalResource: reader,
      unloadContent: true
    })
  );
  expect(resource.features!.triangleFeatureIndices).toEqual(new Uint32Array([1, 0]));
  expect(
    resource.features!.batches.map(batch => batch.data.getChild('feature_id')!.get(0))
  ).toEqual([9007199254740993n, 18446744073709551615n]);
  expect(resource.features!.batches.map(batch => batch.data.getChild('label')!.get(0))).toEqual([
    '東京',
    null
  ]);
  expect(resource.features!.batches.map(batch => batch.data.getChild('value')!.get(0))).toEqual([
    -1, 42
  ]);
  expect(reader).toHaveBeenCalledTimes(4);
  expect(content.featureIds).toEqual(new Uint32Array([12, 12, 12, 7, 7, 7]));
  expect(unload).toHaveBeenCalledOnce();
});

test.each([
  [
    'missing reader',
    (setup: any, options: any) => {
      delete options.readExternalResource;
    },
    'I3S_MESH_SOURCE_FEATURE_MAPPING_REQUIRED'
  ],
  [
    'budget',
    (setup: any, options: any) => {
      options.features.maxAttributeBytes = 8;
    },
    'INPUT_RESOURCE_TOO_LARGE'
  ],
  [
    'invalid budget',
    (setup: any, options: any) => {
      options.features.maxAttributeBytes = Infinity;
    },
    'I3S_MESH_SOURCE_FEATURE_MAPPING_REQUIRED'
  ],
  [
    'vector',
    (setup: any) => {
      setup.metadata.tileset.attributeStorageInfo[0].attributeValues.valuesPerElement = 2;
    },
    'I3S_MESH_SOURCE_ATTRIBUTE_UNSUPPORTED'
  ],
  [
    'custom header',
    (setup: any) => {
      setup.metadata.tileset.attributeStorageInfo[0].header = [];
    },
    'I3S_MESH_SOURCE_ATTRIBUTE_UNSUPPORTED'
  ],
  [
    'duplicate descriptor',
    (setup: any) => {
      setup.metadata.tileset.attributeStorageInfo[1].name = 'OBJECTID';
    },
    'I3S_MESH_SOURCE_FEATURE_MAPPING_REQUIRED'
  ],
  [
    'unmapped field',
    (setup: any) => {
      setup.metadata.tileset.fields = [{name: 'extra'}];
    },
    'I3S_MESH_SOURCE_FEATURE_MAPPING_REQUIRED'
  ],
  [
    'domain',
    (setup: any) => {
      setup.metadata.tileset.fields = [{name: 'value', domain: {}}];
    },
    'I3S_MESH_SOURCE_FEATURE_MAPPING_REQUIRED'
  ],
  [
    'date',
    (setup: any) => {
      setup.metadata.tileset.fields = [{name: 'value', type: 'esriFieldTypeDate'}];
    },
    'I3S_MESH_SOURCE_FEATURE_MAPPING_REQUIRED'
  ],
  [
    'unknown property',
    (setup: any, options: any) => {
      options.features.schema.fields.pop();
    },
    'FEATURE_PROPERTY_NOT_MAPPED'
  ],
  [
    'missing stable property',
    (setup: any, options: any) => {
      options.features.sourceFeatureIdProperty = 'missing';
    },
    'I3S_MESH_SOURCE_FEATURE_MAPPING_REQUIRED'
  ],
  [
    'duplicate IDs',
    (setup: any) => {
      new DataView(setup.resources.OBJECTID.buffer).setUint32(8, 7, true);
    },
    'I3S_MESH_SOURCE_FEATURE_ID_UNSUPPORTED'
  ],
  [
    'missing geometry row',
    (setup: any) => {
      setup.content.featureIds[0] = 99;
    },
    'I3S_MESH_SOURCE_FEATURE_ASSOCIATION_INVALID'
  ],
  [
    'mixed triangle',
    (setup: any) => {
      setup.content.featureIds[0] = 7;
    },
    'I3S_MESH_SOURCE_FEATURE_ASSOCIATION_INVALID'
  ],
  [
    'unused row',
    (setup: any) => {
      setup.content.featureIds.fill(7);
    },
    'I3S_MESH_SOURCE_FEATURE_ASSOCIATION_INVALID'
  ],
  [
    'wrong vertex count',
    (setup: any) => {
      setup.content.sourceAttributes.id.size = 2;
    },
    'I3S_MESH_SOURCE_FEATURE_ID_UNSUPPORTED'
  ],
  [
    'conflicting mapper',
    (setup: any, options: any) => {
      options.getFeatures = createFeatures;
    },
    'I3S_MESH_SOURCE_FEATURE_MAPPING_REQUIRED'
  ],
  [
    'row count',
    (setup: any) => {
      setup.resources.value = new Uint8Array(8);
      new DataView(setup.resources.value.buffer).setUint32(0, 1, true);
    },
    'I3S_MESH_SOURCE_ATTRIBUTE_COUNT_INVALID'
  ]
])('I3S feature %s is rejected', async (_name, change, code) => {
  const setup = createAttributeRuntime();
  const options = {
    features: setup.features,
    readExternalResource: setup.reader,
    unloadContent: true
  };
  change(setup, options);
  await expect(
    readResource(createI3SMeshTilesetConversionSource(setup.runtime, options))
  ).rejects.toMatchObject({code});
  if (_name !== 'conflicting mapper') expect(setup.unload).toHaveBeenCalledOnce();
});

test('I3S resource mapping defaults stable IDs to geometry OIDs without discarding other properties', async () => {
  const setup = createAttributeRuntime();
  const resource = await readResource(
    createI3SMeshTilesetConversionSource(setup.runtime, {
      features: {
        ...setup.features,
        sourceFeatureIdProperty: undefined,
        schema: {
          fields: [
            {name: 'feature_id', type: 'uint32', nullable: false},
            {name: 'stable_id', type: 'uint64', nullable: false},
            ...setup.features.schema.fields.slice(1)
          ]
        }
      },
      readExternalResource: setup.reader
    })
  );
  const batch = resource.features!.batches[0];
  expect(Array.from(batch.data.getChild('feature_id')!)).toEqual([7, 12]);
  expect(Array.from(batch.data.getChild('stable_id')!)).toEqual([
    9007199254740993n,
    18446744073709551615n
  ]);
});

test.each([
  'truncated',
  'nonfinite',
  'stable',
  'prototype'
])('I3S resource values reject %s data explicitly', async variant => {
  const setup = createAttributeRuntime();
  if (variant === 'truncated') setup.resources.value = setup.resources.value.subarray(0, 11);
  if (variant === 'nonfinite') {
    setup.metadata.tileset.attributeStorageInfo[3].attributeValues.valueType = 'Float32';
    new DataView(setup.resources.value.buffer).setFloat32(4, NaN, true);
  }
  if (variant === 'stable')
    new DataView(setup.resources.stable_id.buffer).setBigUint64(16, 9007199254740993n, true);
  const source = createI3SMeshTilesetConversionSource(setup.runtime, {
    features: {
      ...setup.features,
      ...(variant === 'prototype' ? {sourceFeatureIdProperty: 'constructor'} : {})
    },
    readExternalResource: setup.reader,
    unloadContent: true
  });
  await expect(readResource(source)).rejects.toMatchObject({
    code: {
      truncated: 'I3S_MESH_SOURCE_ATTRIBUTE_INVALID',
      nonfinite: 'I3S_MESH_SOURCE_ATTRIBUTE_UNSUPPORTED',
      stable: 'I3S_MESH_SOURCE_FEATURE_ID_UNSUPPORTED',
      prototype: 'I3S_MESH_SOURCE_FEATURE_MAPPING_REQUIRED'
    }[variant]
  });
  expect(setup.unload).toHaveBeenCalledOnce();
});

test('attribute reader cancellation and failures close traversal before emitting a mesh', async () => {
  for (const failure of ['abort', 'read']) {
    const setup = createAttributeRuntime();
    const controller = new AbortController();
    const source = createI3SMeshTilesetConversionSource(setup.runtime, {
      features: setup.features,
      unloadContent: true,
      readExternalResource: async () => {
        if (failure === 'read') throw new Error('attribute read failed');
        controller.abort();
        return setup.resources.OBJECTID;
      }
    });
    await expect(
      source
        .read(await source.inspect(), controller.signal)
        [Symbol.asyncIterator]()
        .next()
    ).rejects.toThrow();
    expect(setup.unload).toHaveBeenCalledOnce();
  }
});

test.each([
  'glb',
  'i3s'
] as const)('original I3S appearance and exact features survive the %s writer path', async format => {
  const setup = createAttributeRuntime();
  const texture = createTextureContent();
  setup.content.material = texture.content.material;
  setup.content.sourceAttributes!.uv0 = {
    value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]),
    size: 2
  };
  const resource = await readResource(
    createI3SMeshTilesetConversionSource(setup.runtime, {
      features: {...setup.features, integer64Encoding: 'decimal-string'},
      readExternalResource: setup.reader
    })
  );
  const spatialContext = createI3SConversionSpatialContext(setup.metadata.spatialReference!, {
    targetCrs: 'EPSG:4978'
  });
  if (format === 'glb') {
    const codec = createMeshConversionCodec({
      spatialContext,
      autoOrigin: true,
      draco: false,
      maxPositionError: 0.01
    });
    const iterator = codec.convert(resource, setup.metadata)[Symbol.asyncIterator]();
    const output = (await iterator.next()).value!;
    const validation = await validateBytes(new Uint8Array(output.glb), {writeTimestamp: false});
    expect(validation.issues.numErrors, JSON.stringify(validation.issues.messages)).toBe(0);
    const parsed = await parse(output.glb, GLTFLoader, {
      core: {worker: false},
      gltf: {loadImages: false}
    });
    const table = parsed.json.extensions!.EXT_structural_metadata.propertyTables[0];
    expect(Array.from(table.properties.feature_id.data)).toEqual([
      9007199254740993n,
      18446744073709551615n
    ]);
    expect(parsed.json.samplers![0]).toMatchObject({wrapS: 33648, wrapT: 33071});
    const scene = new GLTFScenegraph(parsed);
    const image = parsed.json.images![0];
    expect(scene.getTypedArrayForBufferView(image.bufferView!)).toEqual(texture.data);
  } else {
    const codec = createI3SMeshConversionCodec({
      spatialContext,
      draco: false,
      maxPositionError: 0.01,
      maxResourceBytes: 32768
    });
    const iterator = codec.convert(resource, setup.metadata)[Symbol.asyncIterator]();
    const output = (await iterator.next()).value!;
    const gzip = new GZipDecompressor();
    const layer = JSON.parse(
      new TextDecoder().decode(gzip.decompressSync(output.files['3dSceneLayer.json.gz']))
    );
    const idIndex = layer.attributeStorageInfo.findIndex(
      (attribute: {name: string}) => attribute.name === 'feature_id'
    );
    const values = await parse(
      gzip.decompressSync(output.files[`nodes/1/attributes/f_${idIndex}/0.bin.gz`]),
      I3SAttributeLoader,
      {
        attributeName: 'feature_id',
        attributeType: 'String',
        i3s: {attributeValues: 'exact'}
      }
    );
    expect(values.feature_id).toEqual(['9007199254740993', '18446744073709551615']);
    const image = Object.entries(output.files).find(([name]) => name.includes('/textures/'))!;
    expect(new Uint8Array(image[1])).toEqual(texture.data);
    expect(layer.materialDefinitions[0].pbrMetallicRoughness.baseColorTexture).toMatchObject({
      wrapS: 'mirror',
      wrapT: 'none'
    });
  }
});

test('a resource reader cannot remove the validated aggregate attribute byte limit', async () => {
  const setup = createAttributeRuntime();
  setup.features.maxAttributeBytes = 12;
  const reader = async (uri: string) => {
    setup.features.maxAttributeBytes = Infinity;
    return setup.resources[uri];
  };
  await expect(
    readResource(
      createI3SMeshTilesetConversionSource(setup.runtime, {
        features: setup.features,
        readExternalResource: reader,
        unloadContent: true
      })
    )
  ).rejects.toMatchObject({code: 'INPUT_RESOURCE_TOO_LARGE'});
  expect(setup.unload).toHaveBeenCalledOnce();
});

test.each([
  'valid',
  'gap',
  'overlap',
  'mismatch',
  'bounds'
])('I3S legacy feature ranges enforce complete ownership: %s', async variant => {
  const setup = createAttributeRuntime();
  setup.content.drawRanges = [
    {featureId: 12, firstPrimitive: 0, primitiveCount: 1, firstVertex: 0, vertexCount: 3},
    {featureId: 7, firstPrimitive: 1, primitiveCount: 1, firstVertex: 3, vertexCount: 3}
  ];
  if (variant === 'gap') setup.content.drawRanges.pop();
  if (variant === 'overlap') setup.content.drawRanges.push({...setup.content.drawRanges[0]});
  if (variant === 'mismatch') setup.content.drawRanges[0].featureId = 7;
  if (variant === 'bounds') setup.content.drawRanges[0].primitiveCount = 3;
  const source = createI3SMeshTilesetConversionSource(setup.runtime, {
    features: setup.features,
    readExternalResource: setup.reader,
    unloadContent: true
  });
  if (variant === 'valid')
    expect((await readResource(source)).features!.triangleFeatureIndices).toEqual(
      new Uint32Array([1, 0])
    );
  else
    await expect(readResource(source)).rejects.toMatchObject({
      code: 'I3S_MESH_SOURCE_FEATURE_ASSOCIATION_INVALID'
    });
  expect(setup.unload).toHaveBeenCalledOnce();
});

test('I3S object-ID storage accepts the standard ObjectIds ordering label', async () => {
  const setup = createAttributeRuntime();
  const descriptor = setup.metadata.tileset.attributeStorageInfo[0];
  descriptor.objectIds = descriptor.attributeValues;
  delete descriptor.attributeValues;
  descriptor.ordering = ['ObjectIds'];
  const resource = await readResource(
    createI3SMeshTilesetConversionSource(setup.runtime, {
      features: setup.features,
      readExternalResource: setup.reader
    })
  );
  expect(resource.features!.triangleFeatureIndices).toEqual(new Uint32Array([1, 0]));
});
