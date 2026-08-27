// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as arrow from 'apache-arrow';
import type {Mesh} from '@loaders.gl/schema';
import {indexedMeshArrowSchema, meshArrowSchema} from '@loaders.gl/schema';
import {convertMeshToTable, convertTableToMesh, deduceMeshSchema} from '@loaders.gl/schema-utils';
import {validateArrowTableSchema} from '@loaders.gl/arrow';
test('meshArrowSchema', () => {
  expect(meshArrowSchema.fields.length, 'mesh schema has one predefined field').toBe(1);
  const positionField = meshArrowSchema.fields[0];
  expect(positionField.name, 'position field is first').toBe('POSITION');
  expect(positionField.nullable, 'position field is required').toBeFalsy();
  expect(
    positionField.type instanceof arrow.FixedSizeList,
    'position is a fixed-size list'
  ).toBeTruthy();
  expect(positionField.type.listSize, 'position has XYZ tuple size').toBe(3);
  expect(
    positionField.type.children[0].type instanceof arrow.Float32,
    'position values are float32'
  ).toBeTruthy();
});
test('indexedMeshArrowSchema', () => {
  expect(indexedMeshArrowSchema.fields.length, 'indexed schema has two predefined fields').toBe(2);
  expect(indexedMeshArrowSchema.fields[0].name, 'position field is first').toBe('POSITION');
  const indicesField = indexedMeshArrowSchema.fields[1];
  expect(indicesField.name, 'indices field is second').toBe('indices');
  expect(indicesField.nullable, 'indices field is nullable').toBeTruthy();
  expect(indicesField.type instanceof arrow.List, 'indices is a list').toBeTruthy();
  expect(
    indicesField.type.children[0].type instanceof arrow.Int32,
    'indices values are int32'
  ).toBeTruthy();
});
test('convertMeshToTable#unindexed mesh Arrow table round trip', () => {
  const mesh = makeMesh();
  const table = convertMeshToTable(mesh, 'arrow-table');
  expect(table.shape, 'table has arrow-table shape').toBe('arrow-table');
  validateArrowTableSchema(table.data, meshArrowSchema, {schemaName: 'Mesh Arrow table'});
  expect(
    table.data.schema.fields.map(field => field.name),
    'predefined position column is first'
  ).toEqual(['POSITION', 'NORMAL', 'intensity']);
  const intensityColumn = table.data.getChild('intensity');
  expect(intensityColumn, 'scalar intensity column is present').toBeTruthy();
  expect(
    intensityColumn!.type instanceof arrow.FixedSizeList,
    'scalar intensity column is not a fixed-size list'
  ).toBeFalsy();
  expect(
    intensityColumn!.type instanceof arrow.Uint16,
    'scalar intensity column is uint16'
  ).toBeTruthy();
  expect(intensityColumn!.get(0), 'scalar intensity reads as a scalar').toBe(10);
  expect(table.data.getChild('indices'), 'indices column is absent').toBeFalsy();
  const roundTripMesh = convertTableToMesh(table);
  expect(roundTripMesh.indices, 'round trip mesh has no top-level indices').toBeFalsy();
  expect(
    Array.from(roundTripMesh.attributes.POSITION.value),
    'round trip preserves positions'
  ).toEqual(Array.from(mesh.attributes.POSITION.value));
  expect(roundTripMesh.attributes.POSITION.size, 'round trip preserves position size').toBe(3);
  expect(
    Array.from(roundTripMesh.attributes.intensity.value),
    'round trip preserves scalar intensity'
  ).toEqual([10, 20, 30]);
  expect(roundTripMesh.attributes.intensity.size, 'round trip preserves scalar size').toBe(1);
});
test('convertMeshToTable#indexed mesh Arrow table round trip', () => {
  const mesh = makeMesh(new Uint16Array([0, 1, 2]));
  const table = convertMeshToTable(mesh, 'arrow-table');
  validateArrowTableSchema(table.data, indexedMeshArrowSchema, {
    schemaName: 'IndexedMesh Arrow table'
  });
  expect(
    table.data.schema.fields.map(field => field.name),
    'indexed schema fields are first'
  ).toEqual(['POSITION', 'indices', 'NORMAL', 'intensity']);
  const indicesColumn = table.data.getChild('indices');
  expect(indicesColumn, 'indices column is present').toBeTruthy();
  expect(Array.from(indicesColumn!.get(0)!), 'indices are stored in row 0').toEqual([0, 1, 2]);
  expect(indicesColumn!.get(1), 'remaining rows have null indices').toBe(null);
  const roundTripMesh = convertTableToMesh(table);
  expect(roundTripMesh.indices, 'round trip mesh restores top-level indices').toBeTruthy();
  expect(
    roundTripMesh.attributes.indices,
    'round trip mesh does not create an indices attribute'
  ).toBeFalsy();
  expect(Array.from(roundTripMesh.indices!.value), 'round trip mesh preserves indices').toEqual([
    0, 1, 2
  ]);
});
test('convertTableToMesh#honors FixedSizeList chunk offsets', () => {
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
  expect(
    Array.from(roundTripMesh.attributes.POSITION.value),
    'round trip uses the chunk offset when flattening values'
  ).toEqual([1, 0, 0, 0, 1, 0]);
  expect(roundTripMesh.attributes.POSITION.size, 'round trip preserves position size').toBe(3);
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
