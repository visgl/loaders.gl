// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {parse} from '@loaders.gl/core';
import {I3SLoader, I3SContentLoader, type I3STileContent} from '@loaders.gl/i3s';
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
