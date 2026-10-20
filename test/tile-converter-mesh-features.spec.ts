// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {validateBytes} from 'gltf-validator';
import {extractMeshFeatures} from '../apps/tile-converter/src/v5/mesh-source-features';
import {parse} from '@loaders.gl/core';
import {GLTFLoader, GLTFScenegraph, postProcessGLTF} from '@loaders.gl/gltf';
import type {Field, MeshGeometry} from '@loaders.gl/core/schema';
import {
  encodeMeshTile,
  createMeshSourceFeatureOptions,
  convertFeatureAttributesToArrowBatches,
  createMeshConversionCodec,
  createTiles3DConversionSpatialContext,
  type MeshTileFeatures
} from '@loaders.gl/tile-converter/v5';

/** Two triangles share vertices but belong to different table rows. */
function createMesh(): MeshGeometry {
  return {
    topology: 'triangle-list',
    mode: 4,
    attributes: {
      POSITION: {value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1]), size: 3}
    },
    indices: {value: new Uint16Array([0, 1, 2, 0, 2, 3]), size: 1}
  };
}
/** Explicit table with exact IDs, nullable values, empty strings and Unicode. */
function createFeatures(extraField?: Field, values: unknown[] = [null, 7]): MeshTileFeatures {
  return {
    batches: convertFeatureAttributesToArrowBatches(
      [
        {
          featureId: 9007199254740993n,
          metadataClass: 'building',
          properties: {label: null, ...(extraField ? {[extraField.name]: values[0]} : {})}
        },
        {
          featureId: 18446744073709551615n,
          metadataClass: 'building',
          properties: {label: 'München 🏠', ...(extraField ? {[extraField.name]: values[1]} : {})}
        }
      ],
      {
        schema: {
          fields: [
            {name: 'feature_id', type: 'uint64', nullable: false},
            {name: 'label', type: 'utf8', nullable: true},
            ...(extraField ? [extraField] : [])
          ]
        },
        batchSize: 1
      }
    ),
    featureIdField: 'feature_id',
    triangleFeatureIndices: new Uint32Array([1, 0])
  };
}
/** Loads geometry and metadata while keeping binary scene access available for independent inspection. */
async function readMesh(glb: ArrayBuffer) {
  const data = await parse(glb, GLTFLoader, {
    core: {worker: false, useLocalLibraries: true},
    gltf: {loadImages: false}
  });
  return {data, scene: new GLTFScenegraph(data)};
}

test.each([
  false,
  true
])('GLB preserves exact metadata, split vertex ownership and winding with Draco=%s', async draco => {
  const mesh = createMesh();
  const features = createFeatures();
  const codec = createMeshConversionCodec({
    spatialContext: createTiles3DConversionSpatialContext({
      sourceCrs: 'EPSG:4978',
      coordinateFrame: 'geocentric',
      heightReference: 'ellipsoidal'
    }),
    maxPositionError: 0,
    dracoLibraryOptions: {useLocalLibraries: true},
    draco
  });
  const iterator = codec
    .convert({id: 'mesh', mesh, features, origin: [0, 0, 0]}, {})
    [Symbol.asyncIterator]();
  const output = await iterator.next();
  const validation = await validateBytes(new Uint8Array(output.value.glb), {writeTimestamp: false});
  expect(validation.issues.numErrors, JSON.stringify(validation.issues.messages)).toBe(0);
  const {data, scene} = await readMesh(output.value.glb);
  const extension = data.json.extensions!.EXT_structural_metadata;
  expect(extension.propertyTables[0].count).toBe(2);
  expect(Array.from(extension.propertyTables[0].properties.feature_id.data)).toEqual([
    9007199254740993n,
    18446744073709551615n
  ]);
  const property = extension.schema.classes.building.properties.label;
  expect(property.noData).toBe('');
  expect(extension.propertyTables[0].properties.label.data).toEqual(['', 'München 🏠']);
  const bufferView = extension.propertyTables[0].properties.feature_id.values;
  expect(scene.json.bufferViews![bufferView].byteOffset! % 8).toBe(0);
  const primitive = data.json.meshes![0].primitives[0];
  expect(primitive.extensions!.EXT_mesh_features.featureIds[0]).toMatchObject({
    featureCount: 2,
    attribute: 0,
    propertyTable: 0
  });
  const decodedPrimitive = postProcessGLTF(data).meshes[0].primitives[0];
  const attributes = decodedPrimitive.attributes._FEATURE_ID_0.value;
  const positions = decodedPrimitive.attributes.POSITION.value;
  const indices =
    decodedPrimitive.indices?.value ?? Uint32Array.from({length: 6}, (_, index) => index);
  const ownership = new Map<number, string[]>();
  for (let index = 0; index < indices.length; index += 3) {
    const vertices = [0, 1, 2].map(corner => Number(indices[index + corner]));
    const rows = vertices.map(vertex => Number(attributes[vertex]));
    expect(new Set(rows).size).toBe(1);
    ownership.set(
      rows[0],
      vertices.map(vertex => Array.from(positions.slice(vertex * 3, vertex * 3 + 3)).join(','))
    );
  }
  expect([...ownership.keys()].sort()).toEqual([0, 1]);
  for (const [row, vertices] of ownership) {
    const expected = row === 1 ? ['0,0,0', '1,0,0', '0,1,0'] : ['0,0,0', '0,1,0', '0,0,1'];
    const rotated = Array.from({length: 3}, (_, offset) =>
      [...vertices.slice(offset), ...vertices.slice(0, offset)].join(';')
    );
    expect(rotated).toContain(expected.join(';'));
  }
  const postprocessed = postProcessGLTF(data);
  const extracted = extractMeshFeatures(
    postprocessed,
    postprocessed.meshes[0].primitives[0],
    {},
    {
      topology: 'triangle-list',
      mode: 4,
      attributes: Object.fromEntries(
        Object.entries(decodedPrimitive.attributes).map(([name, attribute]) => [
          name,
          {value: attribute.value, size: attribute.components!}
        ])
      ),
      indices: decodedPrimitive.indices
        ? {value: decodedPrimitive.indices.value, size: 1}
        : undefined
    },
    {
      metadataClass: 'building',
      sourceFeatureIdProperty: 'feature_id',
      schema: features.batches[0].schema,
      batchSize: 2
    }
  );
  expect(extracted!.batches[0].data.getChild('label')!.get(0)).toBeNull();
  expect(extracted!.batches[0].data.getChild('label')!.get(1)).toBe('München 🏠');
  expect(extracted!.batches[0].data.getChild('feature_id')!.get(0)).toBe(9007199254740993n);
  expect(primitive.attributes._FEATURE_ID_0).toBeDefined();
  expect(data.json.extensionsRequired ?? []).not.toContain('EXT_mesh_features');
  expect(data.json.extensionsRequired ?? []).not.toContain('EXT_structural_metadata');
  expect(mesh.indices!.value).toEqual(new Uint16Array([0, 1, 2, 0, 2, 3]));
  expect(mesh.attributes.POSITION.value).toHaveLength(12);
});

test.each([
  ['int8', [-128, 127]],
  ['uint8', [0, 255]],
  ['int16', [-32768, 32767]],
  ['uint16', [0, 65535]],
  ['int32', [-2147483648, 2147483647]],
  ['uint32', [0, 4294967295]],
  ['int64', [-9223372036854775808n, 9223372036854775807n]],
  ['uint64', [0n, 18446744073709551615n]],
  ['float32', [1.5, -2.5]],
  ['float64', [1.1, -2.5]]
] as const)('GLB binary properties preserve %s endpoints', async (type, values) => {
  const {data} = await readMesh(
    encodeMeshTile(createMesh(), {
      features: createFeatures({name: 'value', type, nullable: false}, [...values])
    })
  );
  const metadata = data.json.extensions!.EXT_structural_metadata;
  expect(Array.from(metadata.propertyTables[0].properties.value.data)).toEqual(values);
});

test.each([
  'utf8',
  'int32',
  'float64',
  'uint64'
] as const)('nullable %s uses a collision-free noData value', async type => {
  const values = type === 'utf8' ? [null, ''] : type === 'uint64' ? [null, 0n] : [null, 0];
  const features = createFeatures({name: 'value', type, nullable: true}, values);
  const {data} = await readMesh(encodeMeshTile(createMesh(), {features}));
  const metadata = data.json.extensions!.EXT_structural_metadata;
  expect(metadata.schema.classes.building.properties.value.noData).toBe(type === 'utf8' ? '_' : 1);
  expect(metadata.propertyTables[0].properties.value.data[1]).toBe(values[1]);
  const postprocessed = postProcessGLTF(data);
  const primitive = postprocessed.meshes[0].primitives[0];
  const extracted = extractMeshFeatures(
    postprocessed,
    primitive,
    {},
    {
      topology: 'triangle-list',
      mode: 4,
      attributes: {POSITION: {value: primitive.attributes.POSITION.value, size: 3}}
    },
    {
      metadataClass: 'building',
      sourceFeatureIdProperty: 'feature_id',
      schema: features.batches[0].schema,
      batchSize: 2
    }
  );
  expect(extracted!.batches[0].data.getChild('value')!.get(0)).toBeNull();
  expect(extracted!.batches[0].data.getChild('value')!.get(1)).toBe(values[1]);
});

test('feature writer rejects unmapped schemas and invalid associations before emitting a GLB', () => {
  const features = createFeatures();
  expect(() =>
    encodeMeshTile(createMesh(), {
      features: {...features, triangleFeatureIndices: new Uint32Array([0, 2])}
    })
  ).toThrow(/feature row/);
  expect(() =>
    encodeMeshTile(createMesh(), {
      features: {...features, triangleFeatureIndices: new Uint32Array([0, 0])}
    })
  ).toThrow(/feature row/);
  expect(() =>
    encodeMeshTile(createMesh(), {features: {...features, featureIdField: 'missing'}})
  ).toThrow(/identifier/);
  expect(() =>
    encodeMeshTile(createMesh(), {
      features: createFeatures({name: 'flag', type: 'bool', nullable: false}, [true, false])
    })
  ).toThrow(/qualified GLB property/);
  expect(() =>
    encodeMeshTile(createMesh(), {
      features: createFeatures({name: 'value', type: 'float32', nullable: false}, [
        Number.MAX_VALUE,
        1
      ])
    })
  ).toThrow(/float32/);
});

/** Returns a tiny decoded glTF with one declared feature table for schema-mapping conformance. */
async function createDeclaredFeatureFixture() {
  const {data} = await readMesh(encodeMeshTile(createMesh(), {features: createFeatures()}));
  const gltf = postProcessGLTF(data);
  const primitive = gltf.meshes[0].primitives[0];
  const mesh: MeshGeometry = {
    topology: 'triangle-list',
    mode: 4,
    attributes: {POSITION: {value: primitive.attributes.POSITION.value, size: 3}}
  };
  return {gltf, primitive, mesh};
}

test('declared feature schema builds an exact Arrow mapping and round trips nullable Unicode values', async () => {
  const {gltf, primitive, mesh} = await createDeclaredFeatureFixture();
  const options = createMeshSourceFeatureOptions(gltf, {
    metadataClass: 'building',
    sourceFeatureIdProperty: 'feature_id'
  });
  expect(options.schema.fields).toMatchObject([
    {name: 'feature_id', type: 'uint64', nullable: false},
    {name: 'label', type: 'utf8', nullable: true}
  ]);
  const extracted = extractMeshFeatures(gltf, primitive, {}, mesh, options)!;
  expect(Array.from(extracted.batches[0].data.getChild('feature_id')!)).toEqual([
    9007199254740993n,
    18446744073709551615n
  ]);
  expect(Array.from(extracted.batches[0].data.getChild('label')!)).toEqual([null, 'München 🏠']);
  expect(
    JSON.parse(extracted.batches[0].schema.metadata!['loaders.gl:source-schema']).classes.building
  ).toBeDefined();
  const second = await readMesh(encodeMeshTile(mesh, {features: extracted}));
  expect(
    Array.from(
      second.data.json.extensions!.EXT_structural_metadata.propertyTables[0].properties.feature_id
        .data
    )
  ).toEqual([9007199254740993n, 18446744073709551615n]);
});

test('declared optional columns use defaults or nulls and default identifiers remain row indices', async () => {
  const {gltf, primitive, mesh} = await createDeclaredFeatureFixture();
  const metadata = gltf.extensions!.EXT_structural_metadata;
  delete metadata.propertyTables[0].properties.label;
  metadata.schema.classes.building.properties.label.default = '默认';
  const options = createMeshSourceFeatureOptions(gltf, {
    metadataClass: 'building',
    featureIdField: 'row_id'
  });
  let extracted = extractMeshFeatures(gltf, primitive, {}, mesh, options)!;
  expect(Array.from(extracted.batches[0].data.getChild('row_id')!)).toEqual([0, 1]);
  expect(Array.from(extracted.batches[0].data.getChild('label')!)).toEqual(['默认', '默认']);
  delete metadata.schema.classes.building.properties.label.default;
  extracted = extractMeshFeatures(gltf, primitive, {}, mesh, options)!;
  expect(Array.from(extracted.batches[0].data.getChild('label')!)).toEqual([null, null]);
  metadata.schema.classes.building.properties.label.required = true;
  expect(() => extractMeshFeatures(gltf, primitive, {}, mesh, options)).toThrow(/not been decoded/);
});

test.each([
  'array',
  'enum',
  'normalized',
  'scale',
  'unknown-width',
  'required-default',
  'identifier-collision',
  'missing-class',
  'multiple-tables',
  'unmapped-column'
])('declared schema rejects unsupported %s without inferring types from data', async kind => {
  const {gltf} = await createDeclaredFeatureFixture();
  const metadata = gltf.extensions!.EXT_structural_metadata;
  const property = metadata.schema.classes.building.properties.label;
  if (kind === 'array') property.array = true;
  if (kind === 'enum') property.type = 'ENUM';
  if (kind === 'normalized') property.normalized = true;
  if (kind === 'scale') metadata.propertyTables[0].properties.label.scale = 2;
  if (kind === 'unknown-width') {
    property.type = 'SCALAR';
    property.componentType = 'FLOAT16';
  }
  if (kind === 'required-default') {
    property.required = true;
    property.default = 'x';
  }
  if (kind === 'missing-class') delete metadata.schema.classes.building;
  if (kind === 'multiple-tables') metadata.propertyTables.push(metadata.propertyTables[0]);
  if (kind === 'unmapped-column') metadata.propertyTables[0].properties.extra = {data: [1, 2]};
  expect(() => createMeshSourceFeatureOptions(gltf, {metadataClass: 'building'})).toThrow();
});

test.each([
  ['int8', 'INT8'],
  ['uint8', 'UINT8'],
  ['int16', 'INT16'],
  ['uint16', 'UINT16'],
  ['int32', 'INT32'],
  ['uint32', 'UINT32'],
  ['int64', 'INT64'],
  ['uint64', 'UINT64'],
  ['float32', 'FLOAT32'],
  ['float64', 'FLOAT64']
] as const)('declared %s uses source width even when decoded values fit a smaller type', async (type, componentType) => {
  const {gltf} = await createDeclaredFeatureFixture();
  const metadata = gltf.extensions!.EXT_structural_metadata;
  metadata.schema.classes.building.properties.value = {
    type: 'SCALAR',
    componentType,
    required: true
  };
  metadata.propertyTables[0].properties.value = {
    data: type.endsWith('64') && !type.startsWith('float') ? [1n, 2n] : [1, 2]
  };
  const options = createMeshSourceFeatureOptions(gltf, {
    metadataClass: 'building',
    sourceFeatureIdProperty: 'feature_id'
  });
  expect(options.schema.fields.find(field => field.name === 'value')).toMatchObject({
    type,
    nullable: false
  });
});

test('declared int64 defaults retain bigint values and reject unsafe JSON defaults', async () => {
  const {gltf, primitive, mesh} = await createDeclaredFeatureFixture();
  const metadata = gltf.extensions!.EXT_structural_metadata;
  metadata.schema.classes.building.properties.code = {
    type: 'SCALAR',
    componentType: 'INT64',
    default: -7
  };
  const options = createMeshSourceFeatureOptions(gltf, {
    metadataClass: 'building',
    sourceFeatureIdProperty: 'feature_id'
  });
  const extracted = extractMeshFeatures(gltf, primitive, {}, mesh, options)!;
  expect(Array.from(extracted.batches[0].data.getChild('code')!)).toEqual([-7n, -7n]);
  metadata.schema.classes.building.properties.code.default = Number.MAX_SAFE_INTEGER + 1;
  expect(() => extractMeshFeatures(gltf, primitive, {}, mesh, options)).toThrow(
    /exact 64-bit default/
  );
});

test('optional encoded columns cannot become defaults when the decoder did not supply their values', async () => {
  const {gltf, primitive, mesh} = await createDeclaredFeatureFixture();
  const metadata = gltf.extensions!.EXT_structural_metadata;
  metadata.schema.classes.building.properties.label.default = 'fallback';
  const options = createMeshSourceFeatureOptions(gltf, {
    metadataClass: 'building',
    sourceFeatureIdProperty: 'feature_id'
  });
  for (const data of [undefined, null]) {
    metadata.propertyTables[0].properties.label.data = data;
    expect(() => extractMeshFeatures(gltf, primitive, {}, mesh, options)).toThrow(
      /not been decoded/
    );
  }
});

test('shared table counts must match decoded columns without expanding defaults', async () => {
  const {gltf, primitive, mesh} = await createDeclaredFeatureFixture();
  const metadata = gltf.extensions!.EXT_structural_metadata;
  metadata.propertyTables[0].count = 0xffffffff;
  primitive.extensions!.EXT_mesh_features.featureIds[0].featureCount = 2;
  delete metadata.propertyTables[0].properties.label;
  const options = createMeshSourceFeatureOptions(gltf, {
    metadataClass: 'building',
    sourceFeatureIdProperty: 'feature_id'
  });
  expect(() => extractMeshFeatures(gltf, primitive, {}, mesh, options)).toThrow(/row count/);
});

test.each([
  false,
  true
])('shared tables compact indexed primitive rows, retaining stable IDs; explicit=%s', async explicit => {
  const {gltf, primitive, mesh} = await createDeclaredFeatureFixture();
  const metadata = gltf.extensions!.EXT_structural_metadata;
  metadata.propertyTables[0].count = 4;
  primitive.extensions!.EXT_mesh_features.featureIds[0].featureCount = 2;
  primitive.attributes._FEATURE_ID_0.value = new Uint8Array([3, 3, 3, 0, 0, 0]);
  mesh.indices = {size: 1, value: new Uint16Array([0, 1, 2])};
  metadata.propertyTables[0].properties.feature_id.data = new BigUint64Array([
    1n,
    2n,
    3n,
    18446744073709551615n
  ]);
  metadata.propertyTables[0].properties.label.data = ['', 'unused', 'unused', 'München 🏠'];
  metadata.schema.classes.building.properties.optional = {type: 'STRING', default: '默认'};
  const options = createMeshSourceFeatureOptions(gltf, {
    metadataClass: 'building',
    ...(explicit ? {sourceFeatureIdProperty: 'feature_id'} : {featureIdField: 'row_id'})
  });
  const extracted = extractMeshFeatures(gltf, primitive, {}, mesh, options)!;
  expect(extracted.triangleFeatureIndices).toEqual(new Uint32Array([0]));
  expect(extracted.batches.reduce((total, batch) => total + batch.data.numRows, 0)).toBe(1);
  expect(
    Array.from(extracted.batches[0].data.getChild(explicit ? 'feature_id' : 'row_id')!)
  ).toEqual([explicit ? 18446744073709551615n : 3]);
  expect(Array.from(extracted.batches[0].data.getChild('label')!)).toEqual(['München 🏠']);
  expect(Array.from(extracted.batches[0].data.getChild('optional')!)).toEqual(['默认']);
  const output = await readMesh(encodeMeshTile(mesh, {features: extracted}));
  expect(output.data.json.extensions!.EXT_structural_metadata.propertyTables[0].count).toBe(1);
});

test('default-only shared metadata materializes referenced rows without allocating the declared table', async () => {
  const {gltf, primitive, mesh} = await createDeclaredFeatureFixture();
  const metadata = gltf.extensions!.EXT_structural_metadata;
  metadata.propertyTables[0].count = 0xffffffff;
  primitive.extensions!.EXT_mesh_features.featureIds[0].featureCount = 2;
  metadata.propertyTables[0].properties = {};
  metadata.schema.classes.building.properties = {label: {type: 'STRING', default: 'shared'}};
  const options = createMeshSourceFeatureOptions(gltf, {metadataClass: 'building'});
  const extracted = extractMeshFeatures(gltf, primitive, {}, mesh, options)!;
  expect(extracted.batches[0].data.numRows).toBe(2);
  expect(Array.from(extracted.batches[0].data.getChild('label')!)).toEqual(['shared', 'shared']);
});

test.each([
  0, 1, 1.5, 3, 5
])('shared tables reject inconsistent per-primitive feature count %s', async count => {
  const {gltf, primitive, mesh} = await createDeclaredFeatureFixture();
  primitive.extensions!.EXT_mesh_features.featureIds[0].featureCount = count;
  const options = createMeshSourceFeatureOptions(gltf, {
    metadataClass: 'building',
    featureIdField: 'row_id'
  });
  expect(() => extractMeshFeatures(gltf, primitive, {}, mesh, options)).toThrow(/feature count/i);
});

test.each([
  {indices: [0, 1]},
  {indices: [0, 1, 65535]}
])('compaction rejects incomplete or invalid triangle indices $indices', async ({indices}) => {
  const {gltf, primitive, mesh} = await createDeclaredFeatureFixture();
  mesh.indices = {size: 1, value: new Uint16Array(indices)};
  const options = createMeshSourceFeatureOptions(gltf, {
    metadataClass: 'building',
    featureIdField: 'row_id'
  });
  expect(() => extractMeshFeatures(gltf, primitive, {}, mesh, options)).toThrow(/Triangle/);
});

test.each([
  false,
  true
])('compaction rejects mixed triangle ownership but accepts repeated-index connectors; degenerate=%s', async degenerate => {
  const {gltf, primitive, mesh} = await createDeclaredFeatureFixture();
  mesh.indices = {size: 1, value: new Uint16Array(degenerate ? [0, 0, 3] : [0, 1, 3])};
  const options = createMeshSourceFeatureOptions(gltf, {
    metadataClass: 'building',
    featureIdField: 'row_id'
  });
  if (degenerate) {
    const result = extractMeshFeatures(gltf, primitive, {}, mesh, options)!;
    expect(result.triangleFeatureIndices).toEqual(new Uint32Array([0]));
    expect(result.batches[0].data.getChild('row_id')!.get(0)).toBe(1);
  } else
    expect(() => extractMeshFeatures(gltf, primitive, {}, mesh, options)).toThrow(
      /same feature row/
    );
});

test('legacy batch tables compact unused rows while preserving original batch identifiers', async () => {
  const {gltf, primitive, mesh} = await createDeclaredFeatureFixture();
  const options = createMeshSourceFeatureOptions(gltf, {
    metadataClass: 'building',
    featureIdField: 'row_id'
  });
  delete gltf.extensions;
  delete primitive.extensions;
  primitive.attributes._BATCHID = {
    ...primitive.attributes._FEATURE_ID_0,
    value: new Uint8Array([3, 3, 3, 0, 0, 0])
  };
  delete primitive.attributes._FEATURE_ID_0;
  mesh.indices = {size: 1, value: new Uint16Array([0, 1, 2])};
  const extracted = extractMeshFeatures(
    gltf,
    primitive,
    {
      header: {batchLength: 4},
      batchTableJson: {feature_id: [1n, 2n, 3n, 4n], label: ['a', 'b', 'c', 'd']}
    },
    mesh,
    options
  )!;
  expect(extracted.triangleFeatureIndices).toEqual(new Uint32Array([0]));
  expect(Array.from(extracted.batches[0].data.getChild('row_id')!)).toEqual([3]);
  expect(Array.from(extracted.batches[0].data.getChild('label')!)).toEqual(['d']);
});

test('shared property readers treat prototype-like column names as data', async () => {
  const {gltf, primitive, mesh} = await createDeclaredFeatureFixture();
  const metadata = gltf.extensions!.EXT_structural_metadata;
  metadata.schema.classes.building.properties.constructor = {
    type: 'STRING',
    noData: 'missing',
    default: 'fallback'
  };
  metadata.propertyTables[0].properties.constructor = {data: ['missing', 'value']};
  const options = createMeshSourceFeatureOptions(gltf, {
    metadataClass: 'building',
    featureIdField: 'row_id'
  });
  const result = extractMeshFeatures(gltf, primitive, {}, mesh, options)!;
  expect(Array.from(result.batches[0].data.getChild('constructor')!)).toEqual([
    'fallback',
    'value'
  ]);
});
