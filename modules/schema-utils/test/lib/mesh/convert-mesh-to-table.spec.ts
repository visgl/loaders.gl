// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import * as arrow from 'apache-arrow';

import type {Mesh} from '@loaders.gl/schema';
import {indexedMeshArrowSchema, meshArrowSchema} from '@loaders.gl/schema';
import {convertMeshToTable, convertTableToMesh, deduceMeshSchema} from '@loaders.gl/schema-utils';
import {validateArrowTableSchema} from '@loaders.gl/arrow';

test('meshArrowSchema', t => {
  t.equal(meshArrowSchema.fields.length, 1, 'mesh schema has one predefined field');

  const positionField = meshArrowSchema.fields[0];
  t.equal(positionField.name, 'POSITION', 'position field is first');
  t.notOk(positionField.nullable, 'position field is required');
  t.ok(positionField.type instanceof arrow.FixedSizeList, 'position is a fixed-size list');
  t.equal(positionField.type.listSize, 3, 'position has XYZ tuple size');
  t.ok(positionField.type.children[0].type instanceof arrow.Float32, 'position values are float32');

  t.end();
});

test('indexedMeshArrowSchema', t => {
  t.equal(indexedMeshArrowSchema.fields.length, 2, 'indexed schema has two predefined fields');
  t.equal(indexedMeshArrowSchema.fields[0].name, 'POSITION', 'position field is first');

  const indicesField = indexedMeshArrowSchema.fields[1];
  t.equal(indicesField.name, 'indices', 'indices field is second');
  t.ok(indicesField.nullable, 'indices field is nullable');
  t.ok(indicesField.type instanceof arrow.List, 'indices is a list');
  t.ok(indicesField.type.children[0].type instanceof arrow.Int32, 'indices values are int32');

  t.end();
});

test('convertMeshToTable#unindexed mesh Arrow table round trip', t => {
  const mesh = makeMesh();
  const table = convertMeshToTable(mesh, 'arrow-table');

  t.equal(table.shape, 'arrow-table', 'table has arrow-table shape');
  validateArrowTableSchema(table.data, meshArrowSchema, {schemaName: 'Mesh Arrow table'});
  t.deepEqual(
    table.data.schema.fields.map(field => field.name),
    ['POSITION', 'NORMAL', 'intensity'],
    'predefined position column is first'
  );
  const intensityColumn = table.data.getChild('intensity');
  t.ok(intensityColumn, 'scalar intensity column is present');
  t.notOk(
    intensityColumn!.type instanceof arrow.FixedSizeList,
    'scalar intensity column is not a fixed-size list'
  );
  t.ok(intensityColumn!.type instanceof arrow.Uint16, 'scalar intensity column is uint16');
  t.equal(intensityColumn!.get(0), 10, 'scalar intensity reads as a scalar');
  t.notOk(table.data.getChild('indices'), 'indices column is absent');

  const roundTripMesh = convertTableToMesh(table);
  t.notOk(roundTripMesh.indices, 'round trip mesh has no top-level indices');
  t.deepEqual(
    Array.from(roundTripMesh.attributes.POSITION.value),
    Array.from(mesh.attributes.POSITION.value),
    'round trip preserves positions'
  );
  t.equal(roundTripMesh.attributes.POSITION.size, 3, 'round trip preserves position size');
  t.deepEqual(
    Array.from(roundTripMesh.attributes.intensity.value),
    [10, 20, 30],
    'round trip preserves scalar intensity'
  );
  t.equal(roundTripMesh.attributes.intensity.size, 1, 'round trip preserves scalar size');

  t.end();
});

test('convertMeshToTable#indexed mesh Arrow table round trip', t => {
  const mesh = makeMesh(new Uint16Array([0, 1, 2]));
  const table = convertMeshToTable(mesh, 'arrow-table');
  validateArrowTableSchema(table.data, indexedMeshArrowSchema, {
    schemaName: 'IndexedMesh Arrow table'
  });

  t.deepEqual(
    table.data.schema.fields.map(field => field.name),
    ['POSITION', 'indices', 'NORMAL', 'intensity'],
    'indexed schema fields are first'
  );

  const indicesColumn = table.data.getChild('indices');
  t.ok(indicesColumn, 'indices column is present');
  t.deepEqual(Array.from(indicesColumn!.get(0)!), [0, 1, 2], 'indices are stored in row 0');
  t.equal(indicesColumn!.get(1), null, 'remaining rows have null indices');

  const roundTripMesh = convertTableToMesh(table);
  t.ok(roundTripMesh.indices, 'round trip mesh restores top-level indices');
  t.notOk(roundTripMesh.attributes.indices, 'round trip mesh does not create an indices attribute');
  t.deepEqual(
    Array.from(roundTripMesh.indices!.value),
    [0, 1, 2],
    'round trip mesh preserves indices'
  );

  t.end();
});

test('convertTableToMesh#honors FixedSizeList chunk offsets', t => {
  const attributes = {
    POSITION: {
      value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
      size: 3
    }
  };
  const mesh: Mesh = {
    schema: deduceMeshSchema(attributes, {topology: 'point-list', mode: '0'}),
    attributes,
    topology: 'point-list',
    mode: 0
  };
  const table = convertMeshToTable(mesh, 'arrow-table');
  const positionColumn = table.data.getChild('POSITION') as arrow.Vector<arrow.FixedSizeList>;
  const positionData = positionColumn.data[0];
  const offsetPositionData = new arrow.Data<arrow.FixedSizeList>(
    positionData.type,
    1,
    2,
    positionData.nullCount,
    positionData,
    positionData.children
  );
  const offsetTable = new arrow.Table(table.data.schema, {
    POSITION: new arrow.Vector([offsetPositionData])
  });

  const roundTripMesh = convertTableToMesh({...table, data: offsetTable});

  t.deepEqual(
    Array.from(roundTripMesh.attributes.POSITION.value),
    [1, 0, 0, 0, 1, 0],
    'round trip uses the chunk offset when flattening values'
  );
  t.equal(roundTripMesh.attributes.POSITION.size, 3, 'round trip preserves position size');

  t.end();
});

function makeMesh(indices?: Uint16Array): Mesh {
  const attributes = {
    POSITION: {
      value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
      size: 3
    },
    NORMAL: {
      value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]),
      size: 3
    },
    intensity: {
      value: new Uint16Array([10, 20, 30]),
      size: 1
    }
  };
  const topology = indices ? 'triangle-list' : 'point-list';
  const mode = indices ? 4 : 0;

  return {
    schema: deduceMeshSchema(attributes, {topology, mode: String(mode)}),
    attributes,
    indices: indices ? {value: indices, size: 1} : undefined,
    topology,
    mode
  };
}
