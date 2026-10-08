// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {validateBytes} from 'gltf-validator';
import {extractMeshFeatures} from '../apps/tile-converter/src/v5/mesh-source-features';
import {parse} from '@loaders.gl/core';
import {GLTFLoader, GLTFScenegraph, postProcessGLTF} from '@loaders.gl/gltf';
import type {Field, MeshGeometry} from '@loaders.gl/schema';
import {
  encodeMeshTile,
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
