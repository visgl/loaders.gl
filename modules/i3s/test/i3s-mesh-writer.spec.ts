// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeAll, expect, test, vi} from 'vitest';
import {parse} from '@loaders.gl/core';
import {DracoLoader} from '@loaders.gl/draco';
import {Ellipsoid} from '@math.gl/geospatial';
import {ArrowTableBuilder} from '@loaders.gl/schema-utils';
import type {MeshGeometry, Schema} from '@loaders.gl/schema';
import {GZipDecompressor} from '@loaders.gl/compression/gzip-decompressor';
import {
  encodeI3SMeshLayer as encodeRoot,
  encodeI3SMeshLayerWithDraco as encodeDracoRoot,
  I3SContentLoader,
  type I3SMeshFeatures,
  type I3SMeshWriterOptions
} from '@loaders.gl/i3s';
import {encodeI3SMeshLayer, encodeI3SMeshLayerWithDraco} from '@loaders.gl/i3s/i3s-mesh-writer';
import {I3SSceneLayerSchema, I3SNodePageSchema} from '@loaders.gl/i3s/i3s-zod-schema';
import {parseI3STileContent} from '../src/lib/parsers/parse-i3s-tile-content';
import {parseI3STileAttribute} from '../src/lib/parsers/parse-i3s-attribute';
import {encodeI3SMeshAttributes} from '../src/i3s-mesh-attributes';

/** Small indexed two-feature mesh at a nontrivial latitude/longitude. */
function createMesh(): MeshGeometry {
  const positions = new Float64Array(
    [
      10, 45, 100, 10.00001, 45, 100, 10, 45.00001, 100, 10, 45, 101, 10.00001, 45, 101, 10,
      45.00001, 101
    ].flatMap((_, index, all) =>
      index % 3 === 0
        ? Array.from(Ellipsoid.WGS84.cartographicToCartesian(all.slice(index, index + 3)))
        : []
    )
  );
  return {
    topology: 'triangle-list',
    mode: 4,
    attributes: {
      POSITION: {value: positions, size: 3},
      NORMAL: {value: new Float32Array(Array.from({length: 6}, () => [1, 0, 0]).flat()), size: 3}
    },
    indices: {value: new Uint16Array([0, 1, 2, 3, 4, 5]), size: 1}
  };
}

/** Builds an explicit Arrow batch with two stable 64-bit identifiers and nullable Unicode strings. */
function createFeatures(schema?: Schema, rows?: Record<string, unknown>[]): I3SMeshFeatures {
  const selectedSchema = schema || {
    fields: [
      {name: 'feature_id', type: 'uint64', nullable: false},
      {name: 'label', type: 'utf8', nullable: true},
      {name: 'count', type: 'int32', nullable: false},
      {name: 'height', type: 'float64', nullable: false}
    ]
  };
  const builder = new ArrowTableBuilder(selectedSchema);
  for (const row of rows || [
    {feature_id: 9007199254740993n, label: null, count: 0, height: 2.5},
    {feature_id: 18446744073709551615n, label: 'München 🏠', count: -1, height: 0}
  ])
    builder.addObjectRow(row);
  return {
    batches: [builder.finishBatch()!],
    triangleFeatureIndices: new Uint32Array([1, 0]),
    featureIdField: 'feature_id',
    integer64Encoding: 'decimal-string'
  };
}
const OPTIONS: I3SMeshWriterOptions = {maxResourceBytes: 8192, maxPositionError: 0.001};
let layer: ReturnType<typeof encodeI3SMeshLayer>;
let raw: Record<string, ArrayBuffer>;
let metadata: any;
let page: any;
beforeAll(() => {
  layer = encodeI3SMeshLayer(createMesh(), {
    ...OPTIONS,
    features: createFeatures(),
    name: 'Small mesh',
    material: {
      baseColorFactor: [0.2, 0.4, 0.6, 1],
      metallicFactor: 0,
      roughnessFactor: 0.7,
      alphaMode: 'MASK',
      doubleSided: true
    }
  });
  const decompressor = new GZipDecompressor({useNative: false});
  raw = Object.fromEntries(
    Object.entries(layer.files).map(([name, bytes]) => [name, decompressor.decompressSync(bytes)])
  );
  metadata = JSON.parse(new TextDecoder().decode(raw['3dSceneLayer.json.gz']));
  page = JSON.parse(new TextDecoder().decode(raw['nodepages/0.json.gz']));
});

test('I3S authoring is exported and generates schema-valid metadata with an empty root and bounded mesh leaf', () => {
  expect(encodeRoot).toBe(encodeI3SMeshLayer);
  expect(I3SSceneLayerSchema.safeParse(metadata).success).toBe(true);
  expect(I3SNodePageSchema.safeParse(page).success).toBe(true);
  expect(page.nodes[0].mesh).toBeUndefined();
  expect(page.nodes[0].children).toEqual([1]);
  expect(page.nodes[1].mesh.geometry).toEqual({
    definition: 0,
    resource: 1,
    vertexCount: 6,
    featureCount: 2
  });
  expect(metadata.spatialReference).toEqual({wkid: 4326});
  expect(metadata.heightModelInfo).toEqual({heightModel: 'ellipsoidal', heightUnit: 'meter'});
  expect(metadata.materialDefinitions[0]).toMatchObject({
    alphaMode: 'mask',
    alphaCutoff: 0.5,
    doubleSided: true,
    pbrMetallicRoughness: {metallicFactor: 0, roughnessFactor: 0.7}
  });
  const root = JSON.parse(new TextDecoder().decode(raw['nodes/root/3dNodeIndexDocument.json.gz']));
  const leaf = JSON.parse(new TextDecoder().decode(raw['nodes/1/3dNodeIndexDocument.json.gz']));
  expect(root.geometryData).toBeUndefined();
  expect(root.children[0].href).toBe('../1');
  expect(leaf.geometryData[0].href).toBe('./geometries/0');
  expect(leaf.attributeData).toHaveLength(5);
  expect(JSON.parse(new TextDecoder().decode(raw['metadata.json.gz']))).toMatchObject({
    I3SVersion: '1.7',
    nodeCount: 2
  });
});

test('independent binary inspection verifies reordered triangle association, UInt64 OIDs, bounds and normals', async () => {
  const geometry = raw['nodes/1/geometries/0.bin.gz'];
  const view = new DataView(geometry);
  expect([view.getUint32(0, true), view.getUint32(4, true)]).toEqual([6, 2]);
  const featureOffset = 8 + 6 * 24;
  expect([
    view.getBigUint64(featureOffset, true),
    view.getBigUint64(featureOffset + 8, true)
  ]).toEqual([0n, 1n]);
  expect(
    Array.from({length: 4}, (_, index) => view.getUint32(featureOffset + 16 + index * 4, true))
  ).toEqual([0, 0, 1, 1]);
  const content = await parseI3STileContent(
    geometry,
    {
      mbs: [...page.nodes[1].obb.center, 10],
      geometryData: [{href: './geometries/0'}],
      materialDefinition: metadata.materialDefinitions[0]
    } as any,
    {store: metadata.store, geometryDefinitions: metadata.geometryDefinitions} as any
  );
  expect(content.featureIds).toEqual(new Float64Array([0, 0, 0, 1, 1, 1]));
  const expected = createMesh().attributes.POSITION.value;
  const actual = content.attributes.positions.value;
  const center = Ellipsoid.WGS84.cartographicToCartesian(page.nodes[1].obb.center);
  for (let index = 0; index < 6; index++) {
    const sourceIndex = index < 3 ? index + 3 : index - 3;
    expect(
      Math.hypot(
        ...[0, 1, 2].map(axis => actual[index * 3 + axis] - expected[sourceIndex * 3 + axis])
      )
    ).toBeLessThanOrEqual(OPTIONS.maxPositionError);
    for (let axis = 0; axis < 3; axis++)
      expect(Math.abs(actual[index * 3 + axis] - center[axis])).toBeLessThanOrEqual(
        page.nodes[1].obb.halfSize[axis]
      );
  }
  expect(Array.from(content.attributes.normals.value)).toEqual(
    Array.from(createMesh().attributes.NORMAL.value)
  );
});

/** Decodes UTF-8 independently using the published I3S byte-count layout. */
function decodeStrings(buffer: ArrayBuffer): (string | null)[] {
  const view = new DataView(buffer);
  const count = view.getUint32(0, true);
  let offset = 8 + 4 * count;
  return Array.from({length: count}, (_, index) => {
    const size = view.getUint32(8 + 4 * index, true);
    const value = size ? new TextDecoder().decode(new Uint8Array(buffer, offset, size - 1)) : null;
    if (size) expect(view.getUint8(offset + size - 1)).toBe(0);
    offset += size;
    return value;
  });
}

test('Arrow IDs above 2^53, null strings, Unicode, signed integers and doubles retain exact values', () => {
  expect(layer.decimalStringFields).toEqual(['feature_id']);
  expect(decodeStrings(raw['nodes/1/attributes/f_1/0.bin.gz'])).toEqual([
    '9007199254740993',
    '18446744073709551615'
  ]);
  expect(decodeStrings(raw['nodes/1/attributes/f_2/0.bin.gz'])).toEqual([null, 'München 🏠']);
  expect(
    parseI3STileAttribute(raw['nodes/1/attributes/f_2/0.bin.gz'], {
      attributeName: 'label',
      attributeType: 'String',
      i3s: {attributeValues: 'exact'}
    })
  ).toEqual({label: [null, 'München 🏠']});
  const integers = new DataView(raw['nodes/1/attributes/f_3/0.bin.gz']);
  expect([integers.getInt32(4, true), integers.getInt32(8, true)]).toEqual([0, -1]);
  const doubles = new DataView(raw['nodes/1/attributes/f_4/0.bin.gz']);
  expect(doubles.getUint32(4, true)).toBe(0);
  expect([doubles.getFloat64(8, true), doubles.getFloat64(16, true)]).toEqual([2.5, 0]);
});

test('synthetic features, nonindexed geometry, omitted normals/material, empty strings and deterministic bytes work', () => {
  const mesh = createMesh();
  delete mesh.indices;
  delete mesh.attributes.NORMAL;
  const plain = encodeI3SMeshLayer(mesh, OPTIONS);
  expect(plain.decimalStringFields).toEqual([]);
  expect(encodeI3SMeshLayer(mesh, OPTIONS)).toEqual(plain);
  const features = createFeatures(
    {
      fields: [
        {name: 'feature_id', type: 'utf8', nullable: false},
        {name: 'label', type: 'utf8', nullable: true}
      ]
    },
    [
      {feature_id: 'a', label: ''},
      {feature_id: 'b', label: null}
    ]
  );
  const attributes = encodeI3SMeshAttributes(features, 8192);
  expect(decodeStrings(attributes.buffers[1])).toEqual(['a', 'b']);
  expect(decodeStrings(attributes.buffers[2])).toEqual(['', null]);
});

test.each([
  ['budget', (mesh: any, options: any) => (options.maxResourceBytes = 0)],
  ['precision', (mesh: any, options: any) => (options.maxPositionError = -1)],
  ['geometry budget', (mesh: any, options: any) => (options.maxResourceBytes = 10)],
  ['zero tolerance', (mesh: any, options: any) => (options.maxPositionError = 0)],
  ['topology', (mesh: any) => (mesh.topology = 'point-list')],
  ['mode', (mesh: any) => (mesh.mode = 0)],
  ['empty', (mesh: any) => (mesh.attributes.POSITION.value = new Float64Array(0))],
  ['nonfinite', (mesh: any) => (mesh.attributes.POSITION.value[0] = NaN)],
  ['color', (mesh: any) => (mesh.attributes.COLOR_0 = {value: new Uint8Array(24), size: 4})],
  ['layout', (mesh: any) => (mesh.attributes.POSITION.byteStride = 24)],
  ['normal count', (mesh: any) => (mesh.attributes.NORMAL.value = new Float32Array(3))],
  ['normal unit', (mesh: any) => (mesh.attributes.NORMAL.value[0] = 2)],
  ['normal finite', (mesh: any) => (mesh.attributes.NORMAL.value[1] = NaN)],
  ['signed index', (mesh: any) => (mesh.indices.value = new Int16Array([0, 1, 2]))],
  ['index layout', (mesh: any) => (mesh.indices.byteOffset = 4)],
  ['index range', (mesh: any) => (mesh.indices.value[0] = 6)],
  ['partial triangle', (mesh: any) => (mesh.indices.value = new Uint8Array([0, 1]))],
  ['undefined center', (mesh: any) => mesh.attributes.POSITION.value.fill(0)],
  ['texture', (_mesh: any, options: any) => (options.material = {baseColorTexture: {}})],
  ['factor', (_mesh: any, options: any) => (options.material = {metallicFactor: 2})],
  [
    'base color',
    (_mesh: any, options: any) => (options.material = {baseColorFactor: [1, 1, NaN, 1]})
  ],
  ['alpha', (_mesh: any, options: any) => (options.material = {alphaMode: 'invalid'})],
  ['cutoff', (_mesh: any, options: any) => (options.material = {alphaCutoff: 0.5})],
  ['double sided', (_mesh: any, options: any) => (options.material = {doubleSided: 1})]
])('I3S rejects unsupported/invalid mesh %s', (_name, mutate) => {
  const mesh = createMesh();
  const options = {...OPTIONS};
  mutate(mesh, options);
  expect(() => encodeI3SMeshLayer(mesh, options)).toThrow();
});

test.each([
  ['missing schema', (features: any) => delete features.batches[0].schema],
  ['empty table', (features: any) => (features.batches = [])],
  [
    'nullable identifier',
    (features: any) => (features.batches[0].schema.fields[0].nullable = true)
  ],
  ['missing identifier', (features: any) => (features.featureIdField = 'missing')],
  ['integer mapping', (features: any) => delete features.integer64Encoding],
  ['bad association', (features: any) => (features.triangleFeatureIndices[0] = 2)],
  ['missing association', (features: any) => (features.triangleFeatureIndices = undefined)],
  [
    'association count',
    (features: any) => (features.triangleFeatureIndices = new Uint32Array([0]))
  ],
  ['unused row', (features: any) => (features.triangleFeatureIndices = new Uint32Array([0, 0]))],
  ['wrong row count', (features: any) => (features.batches[0].length = 3)],
  ['field name', (features: any) => (features.batches[0].schema.fields[1].name = 'bad name')],
  ['reserved field', (features: any) => (features.batches[0].schema.fields[1].name = 'objectid')],
  ['missing column', (features: any) => (features.batches[0].schema.fields[1].name = 'missing')],
  ['unsupported scalar', (features: any) => (features.batches[0].schema.fields[2].type = 'bool')]
])('I3S rejects invalid or unmapped features %s', (_name, mutate) => {
  const features = createFeatures();
  mutate(features);
  expect(() => encodeI3SMeshLayer(createMesh(), {...OPTIONS, features})).toThrow();
});

test.each([
  'same',
  'bad\0string'
])('I3S rejects duplicate IDs or invalid string content %s', identifier => {
  const features = createFeatures({fields: [{name: 'feature_id', type: 'utf8', nullable: false}]}, [
    {feature_id: identifier},
    {feature_id: identifier === 'same' ? identifier : 'other'}
  ]);
  expect(() => encodeI3SMeshAttributes(features, 8192)).toThrow();
});

test('I3S attributes reject nullable numeric values and over-budget buffers', () => {
  const features = createFeatures(
    {
      fields: [
        {name: 'feature_id', type: 'utf8', nullable: false},
        {name: 'count', type: 'int32', nullable: true}
      ]
    },
    [
      {feature_id: 'a', count: null},
      {feature_id: 'b', count: 1}
    ]
  );
  expect(() => encodeI3SMeshAttributes(features, 8192)).toThrow(/non-null/);
  expect(() => encodeI3SMeshAttributes(createFeatures(), 8)).toThrow(/maxResourceBytes/);
});

test('I3S rejects malformed Unicode returned by an externally supplied Arrow table', () => {
  const features = createFeatures({fields: [{name: 'feature_id', type: 'utf8', nullable: false}]}, [
    {feature_id: 'a'},
    {feature_id: 'b'}
  ]);
  features.batches[0].data.getChild = (() => ({
    length: 2,
    get: (index: number) => (index ? 'other' : '\uD800')
  })) as any;
  expect(() => encodeI3SMeshAttributes(features, 8192)).toThrow(/Unicode/);
});

test.each([
  'terminator',
  'length',
  'utf8'
])('exact I3S string reading rejects malformed %s', kind => {
  const features = createFeatures({fields: [{name: 'feature_id', type: 'utf8', nullable: false}]}, [
    {feature_id: 'a'},
    {feature_id: 'b'}
  ]);
  const buffer = encodeI3SMeshAttributes(features, 8192).buffers[1];
  const view = new DataView(buffer);
  if (kind === 'terminator') view.setUint8(17, 1);
  if (kind === 'length') view.setUint32(4, 99, true);
  if (kind === 'utf8') view.setUint8(16, 255);
  expect(() =>
    parseI3STileAttribute(buffer, {
      attributeName: 'id',
      attributeType: 'String',
      i3s: {attributeValues: 'exact'}
    })
  ).toThrow();
});

test('I3S scalar schema validation rejects reserved names, unsupported widths, and missing Arrow columns', () => {
  for (const field of [
    {name: 'objectid', type: 'utf8'},
    {name: 'bad name', type: 'utf8'},
    {name: 'flag', type: 'bool'},
    {name: 'unsigned', type: 'uint32'}
  ]) {
    const features = createFeatures(
      {
        fields: [
          {name: 'feature_id', type: 'utf8', nullable: false},
          {...field, nullable: true}
        ]
      },
      [
        {feature_id: 'a', [field.name]: null},
        {feature_id: 'b', [field.name]: null}
      ]
    );
    expect(() => encodeI3SMeshAttributes(features, 8192)).toThrow();
  }
  const features = createFeatures();
  const getChild = features.batches[0].data.getChild.bind(features.batches[0].data);
  features.batches[0].data.getChild = ((name: string) =>
    name === 'label' ? null : getChild(name)) as any;
  expect(() => encodeI3SMeshAttributes(features, 8192)).toThrow(/Missing Arrow column/);
  features.batches[0].data.getChild = (() => null) as any;
  expect(() => encodeI3SMeshAttributes(features, 8192)).toThrow(/identifier column/);
});

test('I3S rejects rounded integer64 values and per-resource string/numeric caps', () => {
  const features = createFeatures();
  const getChild = features.batches[0].data.getChild.bind(features.batches[0].data);
  features.batches[0].data.getChild = ((name: string) =>
    name === 'feature_id' ? {length: 2, get: (index: number) => index} : getChild(name)) as any;
  expect(() => encodeI3SMeshAttributes(features, 8192)).toThrow(/bigint/);
  expect(() => encodeI3SMeshAttributes(createFeatures(), 30)).toThrow(/maxResourceBytes/);
  const numeric = createFeatures(
    {fields: [{name: 'feature_id', type: 'float64', nullable: false}]},
    [{feature_id: 0}, {feature_id: 1}]
  );
  expect(() => encodeI3SMeshAttributes(numeric, 16)).toThrow(/maxResourceBytes/);
});

test('I3S accepts signed integer64 batches and preserves row order across batch boundaries', () => {
  const schema: Schema = {fields: [{name: 'feature_id', type: 'int64', nullable: false}]};
  const first = createFeatures(schema, [{feature_id: -9223372036854775808n}]);
  const second = createFeatures(schema, [{feature_id: 9223372036854775807n}]);
  const features = {...first, batches: [...first.batches, ...second.batches]};
  expect(decodeStrings(encodeI3SMeshAttributes(features, 8192).buffers[1])).toEqual([
    '-9223372036854775808',
    '9223372036854775807'
  ]);
  const mismatched = createFeatures();
  expect(() =>
    encodeI3SMeshAttributes({...features, batches: [...first.batches, ...mismatched.batches]}, 8192)
  ).toThrow(/share/);
});

test('I3S rejects antimeridian geometry and metadata that exceeds its own resource budget', () => {
  const mesh = createMesh();
  delete mesh.indices;
  delete mesh.attributes.NORMAL;
  expect(() => encodeI3SMeshLayer(mesh, {...OPTIONS, maxResourceBytes: 100})).toThrow(/resource/);
  mesh.attributes.POSITION.value = new Float64Array(
    [
      [179.999, 0, 100],
      [-179.999, 0, 100],
      [179.999, 0.001, 100]
    ].flatMap(value => Array.from(Ellipsoid.WGS84.cartographicToCartesian(value)))
  );
  expect(() => encodeI3SMeshLayer(mesh, OPTIONS)).toThrow(/antimeridian/);
});

test('I3S refuses null values in declared non-nullable text fields', () => {
  const features = createFeatures(
    {
      fields: [
        {name: 'feature_id', type: 'utf8', nullable: false},
        {name: 'label', type: 'utf8', nullable: false}
      ]
    },
    [
      {feature_id: 'a', label: null},
      {feature_id: 'b', label: 'b'}
    ]
  );
  expect(() => encodeI3SMeshAttributes(features, 8192)).toThrow(/non-nullable/);
});

test.each([
  {linear: [0, 0.001, 0.0031308, 0.25], encoded: [0, 0.01292, 0.040449936, 0.25]},
  {linear: [0.5, 0.2, 1, 0.5], encoded: [0.7353569830524495, 0.48452920448170694, 1, 0.5]},
  {
    linear: [0.0031309, 0.6, 0.4, 1],
    encoded: [0.04045117777859802, 0.7977377330312598, 0.6651850846308363, 1]
  }
])('I3S encodes linear RGB $linear as sRGB and reconstructs linear rendering factors', async ({
  linear,
  encoded
}) => {
  const material = {baseColorFactor: linear as [number, number, number, number]};
  const generated = encodeI3SMeshLayer(createMesh(), {...OPTIONS, material});
  const decompressor = new GZipDecompressor({useNative: false});
  const definition = JSON.parse(
    new TextDecoder().decode(decompressor.decompressSync(generated.files['3dSceneLayer.json.gz']))
  );
  const stored = definition.materialDefinitions[0].pbrMetallicRoughness.baseColorFactor;
  stored.forEach((value: number, index: number) => expect(value).toBeCloseTo(encoded[index], 12));
  const node = JSON.parse(
    new TextDecoder().decode(
      decompressor.decompressSync(generated.files['nodes/1/3dNodeIndexDocument.json.gz'])
    )
  );
  const content = await parseI3STileContent(
    decompressor.decompressSync(generated.files['nodes/1/geometries/0.bin.gz']),
    {...node, materialDefinition: definition.materialDefinitions[0]},
    definition
  );
  content.material.pbrMetallicRoughness.baseColorFactor.forEach((value: number, index: number) =>
    expect(value).toBeCloseTo(linear[index], 12)
  );
  expect(content.material.pbrMetallicRoughness.baseColorFactor[3]).toBe(linear[3]);
  expect(material.baseColorFactor).toEqual(linear);
});

/** Decodes one tiny authored layer through the public I3S parser and real full Draco decoder. */
async function decodeDracoLayer(encoded: Awaited<ReturnType<typeof encodeI3SMeshLayerWithDraco>>) {
  const decompressor = new GZipDecompressor({useNative: false});
  const resources = Object.fromEntries(
    Object.entries(encoded.files).map(([name, buffer]) => [
      name,
      decompressor.decompressSync(buffer)
    ])
  );
  const layerMetadata = JSON.parse(new TextDecoder().decode(resources['3dSceneLayer.json.gz']));
  const nodes = JSON.parse(new TextDecoder().decode(resources['nodepages/0.json.gz']));
  const geometry = resources['nodes/1/geometries/0.bin.gz'];
  const content = await parse(geometry.slice(0), I3SContentLoader, {
    core: {worker: false, useLocalLibraries: true},
    i3s: {
      _tileOptions: {isDracoGeometry: true, mbs: [...nodes.nodes[1].obb.center, 10]},
      _tilesetOptions: {
        store: layerMetadata.store,
        geometryDefinitions: layerMetadata.geometryDefinitions
      }
    }
  });
  return {content: content!, resources, layerMetadata, nodes, geometry};
}

const DRACO_PROFILES = [
  {normals: false, features: false},
  {normals: true, features: false},
  {normals: false, features: true},
  {normals: true, features: true}
];
let compressedLayers: Awaited<ReturnType<typeof decodeDracoLayer>>[];
beforeAll(async () => {
  compressedLayers = [];
  for (const profile of DRACO_PROFILES) {
    const mesh = createMesh();
    if (!profile.normals) delete mesh.attributes.NORMAL;
    const features = profile.features ? createFeatures() : undefined;
    const originalPositions = mesh.attributes.POSITION.value.slice();
    const originalIndices = mesh.indices!.value.slice();
    const encoded = await encodeI3SMeshLayerWithDraco(
      mesh,
      {...OPTIONS, features},
      {useLocalLibraries: true}
    );
    const rawLayer = encodeI3SMeshLayer(mesh, {...OPTIONS, features});
    expect(encoded.maximumPositionError).toBe(rawLayer.maximumPositionError);
    expect(encoded.decimalStringFields).toEqual(rawLayer.decimalStringFields);
    for (const name of Object.keys(encoded.files)) {
      if (
        !['3dSceneLayer.json.gz', 'nodepages/0.json.gz', 'nodes/1/geometries/0.bin.gz'].includes(
          name
        )
      )
        expect(encoded.files[name]).toEqual(rawLayer.files[name]);
    }
    expect(mesh.attributes.POSITION.value).toEqual(originalPositions);
    expect(mesh.indices!.value).toEqual(originalIndices);
    compressedLayers.push(await decodeDracoLayer(encoded));
  }
});

test.each(
  DRACO_PROFILES
)('I3S Edge Breaker preserves oriented triangles, normals and feature ownership: %j', profile => {
  const decoded = compressedLayers[DRACO_PROFILES.indexOf(profile)];
  expect(encodeDracoRoot).toBe(encodeI3SMeshLayerWithDraco);
  expect(new TextDecoder().decode(decoded.geometry.slice(0, 5))).toBe('DRACO');
  expect(new Uint8Array(decoded.geometry)[8]).toBe(1);
  expect(I3SSceneLayerSchema.safeParse(decoded.layerMetadata).success).toBe(true);
  expect(I3SNodePageSchema.safeParse(decoded.nodes).success).toBe(true);
  expect(decoded.layerMetadata.geometryDefinitions[0].geometryBuffers).toEqual([
    {
      compressedAttributes: {
        encoding: 'draco',
        attributes: ['position', ...(profile.normals ? ['normal'] : []), 'feature-index']
      }
    }
  ]);
  const {content} = decoded;
  const expected = createMesh().attributes.POSITION.value;
  const indices = content.indices!;
  const triangles = [] as string[];
  for (let triangle = 0; triangle < indices.length; triangle += 3) {
    const corners = [] as number[];
    for (let corner = 0; corner < 3; corner++) {
      const vertex = Number(indices[triangle + corner]);
      const position = content.attributes.positions.value.subarray(vertex * 3, vertex * 3 + 3);
      const distances = Array.from({length: 6}, (_, index) =>
        Math.hypot(...[0, 1, 2].map(axis => position[axis] - Number(expected[index * 3 + axis])))
      );
      const original = distances.indexOf(Math.min(...distances));
      expect(distances[original]).toBeLessThanOrEqual(OPTIONS.maxPositionError);
      corners.push(original);
      expect(content.featureIds[vertex]).toBe(profile.features ? (original < 3 ? 1 : 0) : 0);
      if (profile.normals)
        expect(content.attributes.normals.value.subarray(vertex * 3, vertex * 3 + 3)).toEqual(
          new Float32Array([1, 0, 0])
        );
      const center = Ellipsoid.WGS84.cartographicToCartesian(decoded.nodes.nodes[1].obb.center);
      for (let axis = 0; axis < 3; axis++)
        expect(Math.abs(position[axis] - center[axis])).toBeLessThanOrEqual(
          decoded.nodes.nodes[1].obb.halfSize[axis]
        );
    }
    triangles.push(
      [0, 1, 2]
        .map(index => [...corners.slice(index), ...corners.slice(0, index)].join(','))
        .sort()[0]
    );
  }
  expect(triangles.sort()).toEqual(['0,1,2', '3,4,5']);
  expect(decoded.nodes.nodes[1].mesh.geometry.vertexCount).toBe(content.vertexCount);
});

test('I3S Draco records decoded vertex counts for shared indexed vertices', async () => {
  const mesh = createMesh();
  mesh.indices = {value: new Uint16Array([0, 1, 2, 0, 2, 3]), size: 1};
  const encoded = await encodeI3SMeshLayerWithDraco(mesh, OPTIONS, {useLocalLibraries: true});
  const decoded = await decodeDracoLayer(encoded);
  expect(decoded.content.indices!.length).toBe(6);
  expect(decoded.content.vertexCount).toBe(4);
  expect(decoded.nodes.nodes[1].mesh.geometry.vertexCount).toBe(4);
  expect(Array.from(decoded.content.featureIds)).toEqual([0, 0, 0, 0]);
  expect(encoded.maximumPositionError).toBeLessThanOrEqual(OPTIONS.maxPositionError);
});

test('I3S Draco caps emitted resources instead of temporary raw geometry', async () => {
  const mesh = createMesh();
  const width = 13;
  const vertexCount = width * width;
  mesh.attributes.POSITION.value = Float64Array.from(
    {length: vertexCount * 3},
    (_, index) =>
      [6378137, (Math.floor(index / 3) % width) / 10, Math.floor(index / (width * 3)) / 10][
        index % 3
      ]
  );
  mesh.attributes.NORMAL.value = Float32Array.from({length: vertexCount * 3}, (_, index) =>
    index % 3 === 0 ? 1 : 0
  );
  const indices: number[] = [];
  for (let row = 0; row < width - 1; row++) {
    for (let column = 0; column < width - 1; column++) {
      const vertex = row * width + column;
      indices.push(
        vertex,
        vertex + 1,
        vertex + width,
        vertex + 1,
        vertex + width + 1,
        vertex + width
      );
    }
  }
  mesh.indices = {value: new Uint16Array(indices), size: 1};
  expect(() => encodeI3SMeshLayer(mesh, OPTIONS)).toThrow('geometry exceeds maxResourceBytes');
  const encoded = await encodeI3SMeshLayerWithDraco(mesh, OPTIONS, {useLocalLibraries: true});
  const decoded = await decodeDracoLayer(encoded);
  for (const resource of Object.values(decoded.resources))
    expect(resource.byteLength).toBeLessThanOrEqual(OPTIONS.maxResourceBytes);
  expect(decoded.content.indices!.length).toBe(indices.length);
  expect(decoded.content.vertexCount).toBe(vertexCount);
  expect(new Uint8Array(decoded.geometry)[8]).toBe(1);
});

test('I3S Draco rejects failed verification before exposing resources', async () => {
  const originalLoader = await DracoLoader.preload('', {core: {useLocalLibraries: true}});
  const decoded = await parse(compressedLayers[1].geometry, DracoLoader, {
    core: {worker: false, useLocalLibraries: true},
    draco: {shape: 'mesh', attributeNameEntry: 'i3s-attribute-type'}
  });
  const preload = vi.spyOn(DracoLoader, 'preload');
  try {
    preload.mockResolvedValueOnce({
      ...originalLoader,
      parse: async () => ({...decoded, indices: null})
    } as any);
    await expect(
      encodeI3SMeshLayerWithDraco(createMesh(), OPTIONS, {useLocalLibraries: true})
    ).rejects.toThrow('must preserve oriented triangles');
    preload.mockRejectedValueOnce(new Error('decoder failed'));
    await expect(
      encodeI3SMeshLayerWithDraco(createMesh(), OPTIONS, {useLocalLibraries: true})
    ).rejects.toThrow('decoder failed');
  } finally {
    preload.mockRestore();
  }
});

test.each([
  [
    'winding',
    (mesh: any) => {
      const value = mesh.indices.value;
      [value[0], value[1]] = [value[1], value[0]];
    }
  ],
  [
    'position',
    (mesh: any) => {
      mesh.attributes.POSITION.value[0] += 1;
    }
  ],
  [
    'normal',
    (mesh: any) => {
      mesh.attributes.NORMAL.value[0] += 1;
    }
  ],
  [
    'feature association',
    (mesh: any) => {
      mesh.attributes['feature-index'].value[0] ^= 1;
    }
  ],
  [
    'feature dictionary',
    (mesh: any) => {
      getFeatureMetadata(mesh).metadata['i3s-feature-ids'].intArray[0] = 99;
    }
  ],
  [
    'missing feature metadata',
    (mesh: any) => {
      delete getFeatureMetadata(mesh).metadata;
    }
  ],
  [
    'missing feature dictionary',
    (mesh: any) => {
      delete getFeatureMetadata(mesh).metadata['i3s-feature-ids'];
    }
  ],
  [
    'missing dictionary values',
    (mesh: any) => {
      delete getFeatureMetadata(mesh).metadata['i3s-feature-ids'].intArray;
    }
  ]
] as const)('I3S Draco verification rejects changed %s', async (_name, change) => {
  const loaderOptions = {
    core: {worker: false, useLocalLibraries: true},
    draco: {shape: 'mesh' as const, attributeNameEntry: 'i3s-attribute-type'}
  };
  const decoded = structuredClone(
    await parse(compressedLayers[3].geometry, DracoLoader, loaderOptions)
  );
  change(decoded);
  const loader = await DracoLoader.preload('', loaderOptions);
  const preload = vi
    .spyOn(DracoLoader, 'preload')
    .mockResolvedValueOnce({...loader, parse: async () => decoded} as any);
  try {
    await expect(
      encodeI3SMeshLayerWithDraco(
        createMesh(),
        {...OPTIONS, features: createFeatures()},
        {useLocalLibraries: true}
      )
    ).rejects.toThrow('must preserve oriented triangles');
  } finally {
    preload.mockRestore();
  }
});

test('I3S Draco captures the resource cap before asynchronous decoder loading', async () => {
  const options = {...OPTIONS, maxResourceBytes: 512};
  const originalPreload = DracoLoader.preload;
  const preload = vi
    .spyOn(DracoLoader, 'preload')
    .mockImplementationOnce(async (url, loaderOptions) => {
      options.maxResourceBytes = Infinity;
      return originalPreload(url, loaderOptions);
    });
  try {
    await expect(
      encodeI3SMeshLayerWithDraco(createMesh(), options, {useLocalLibraries: true})
    ).rejects.toThrow('exceeds maxResourceBytes');
  } finally {
    preload.mockRestore();
  }
});

/** Locates the authoritative Draco attribute metadata by its I3S semantic. */
function getFeatureMetadata(mesh: any): any {
  return Object.values(mesh.loaderData.attributes).find(
    (attribute: any) => attribute.metadata['i3s-attribute-type']?.string === 'feature-index'
  );
}
