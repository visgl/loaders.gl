import {expect, test} from 'vitest';
import {validateWriter, validateMeshCategoryData} from 'test/common/conformance';
import {QuantizedMeshLoader, QuantizedMeshWriter} from '@loaders.gl/terrain';
import {encode, parse} from '@loaders.gl/core';
import {convertMeshToTable, deduceMeshSchema} from '@loaders.gl/schema-utils';
const attributes = {
  POSITION: {value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 1]), size: 3}
};
const mesh = {
  attributes,
  indices: {value: new Uint32Array([0, 1, 2]), size: 1},
  topology: 'triangle-list',
  mode: 4,
  schema: deduceMeshSchema(attributes, {topology: 'triangle-list', mode: '4'})
};
test('QuantizedMeshWriter#writer conformance', () => {
  validateWriter(QuantizedMeshWriter, 'QuantizedMeshWriter');
});
test('QuantizedMeshWriter#encode plain and Arrow mesh data', async () => {
  const options = {'quantized-mesh': {bounds: [0, 0, 1, 1]}};
  const arrayBuffer = await encode(mesh, QuantizedMeshWriter, options);
  const data = await parse(arrayBuffer, QuantizedMeshLoader, options);
  validateMeshCategoryData(data);
  expect(data.mode, 'mode is TRIANGLES (4)').toBe(4);
  expect(data.attributes.POSITION.value.length, 'POSITION attribute roundtripped').toBe(9);
  expect(data.indices.value.length, 'indices roundtripped').toBe(3);
  const arrowTable = convertMeshToTable(mesh, 'arrow-table');
  const arrowArrayBuffer = await encode(arrowTable, QuantizedMeshWriter, options);
  const arrowData = await parse(arrowArrayBuffer, QuantizedMeshLoader, options);
  validateMeshCategoryData(arrowData);
  expect(arrowData.attributes.POSITION.value.length, 'Arrow POSITION attribute roundtripped').toBe(
    9
  );
});
test('QuantizedMeshWriter#encodes non-sequential triangle indices', async () => {
  const reorderedMesh = {
    ...mesh,
    indices: {value: new Uint32Array([0, 2, 1]), size: 1}
  };
  const options = {'quantized-mesh': {bounds: [0, 0, 1, 1]}};
  const arrayBuffer = await encode(reorderedMesh, QuantizedMeshWriter, options);
  const data = await parse(arrayBuffer, QuantizedMeshLoader, options);
  validateMeshCategoryData(data);
  expect(data.mode, 'mode is TRIANGLES (4)').toBe(4);
  expect(data.indices.value.length, 'indices roundtripped').toBe(3);
});
