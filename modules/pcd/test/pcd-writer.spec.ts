import {expect, test} from 'vitest';
import {validateWriter, validateMeshCategoryData} from 'test/common/conformance';
import {PCDLoader, PCDWriter} from '@loaders.gl/pcd';
import {encode, parse} from '@loaders.gl/core';
import {convertMeshToTable, deduceMeshSchema} from '@loaders.gl/schema-utils';
const attributes = {
  POSITION: {value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 1]), size: 3},
  NORMAL: {value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]), size: 3}
};
const mesh = {
  attributes,
  topology: 'point-list' as const,
  mode: 0,
  schema: deduceMeshSchema(attributes, {topology: 'point-list', mode: '0'})
};
test('PCDWriter#writer conformance', () => {
  validateWriter(PCDWriter, 'PCDWriter');
});
test('PCDWriter#encode plain and Arrow mesh data', async () => {
  const arrayBuffer = await encode(mesh, PCDWriter);
  const data = await parse(arrayBuffer, PCDLoader, {core: {worker: false}});
  validateMeshCategoryData(data);
  expect(data.mode, 'mode is POINTS (0)').toBe(0);
  expect(data.attributes.POSITION.value.length, 'POSITION attribute roundtripped').toBe(9);
  const arrowTable = convertMeshToTable(mesh, 'arrow-table');
  const arrowArrayBuffer = await encode(arrowTable, PCDWriter);
  const arrowData = await parse(arrowArrayBuffer, PCDLoader, {core: {worker: false}});
  validateMeshCategoryData(arrowData);
  expect(arrowData.attributes.POSITION.value.length, 'Arrow POSITION attribute roundtripped').toBe(
    9
  );
});
