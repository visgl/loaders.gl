// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeAll, expect, test} from 'vitest';
import {Ellipsoid} from '@math.gl/geospatial';
import {ArrowTableBuilder} from '@loaders.gl/schema-utils';
import type {MeshGeometry, Schema} from '@loaders.gl/schema';
import {GZipDecompressor} from '@loaders.gl/compression/gzip-decompressor';
import {
  encodeI3SMeshLayer as encodeRoot,
  type I3SMeshFeatures,
  type I3SMeshWriterOptions
} from '@loaders.gl/i3s';
import {encodeI3SMeshLayer} from '@loaders.gl/i3s/i3s-mesh-writer';
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
  expect(() => encodeI3SMeshLayer(mesh, {...OPTIONS, maxResourceBytes: 100})).toThrow(/JSON/);
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
