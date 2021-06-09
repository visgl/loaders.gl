/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {validateLoader, validateMeshCategoryData} from 'test/common/conformance';

import {PCDLoader, PCDWorkerLoader} from '@loaders.gl/pcd';
import {setLoaderOptions, fetchFile, parse, load} from '@loaders.gl/core';

const PCD_ASCII_URL = '@loaders.gl/pcd/test/data/simple-ascii.pcd';
const PCD_BINARY_URL = '@loaders.gl/pcd/test/data/Zaghetto.pcd';

setLoaderOptions({
  _workerType: 'test'
});

test('PCDLoader#loader conformance', (t) => {
  validateLoader(t, PCDLoader, 'PCDLoader');
  validateLoader(t, PCDWorkerLoader, 'PCDWorkerLoader');
  t.end();
});

test('PCDLoader#parse(text)', async (t) => {
  const data = await parse(fetchFile(PCD_ASCII_URL), PCDLoader, {worker: false});
  validateMeshCategoryData(t, data);

  t.equal(data.schema.fields.length, 2, 'schema field count is correct');
  t.equal(data.schema.metadata.get('mode'), '0', 'schema metadata is correct');
  t.ok(data.schema.metadata.get('boundingBox'), 'schema metadata is correct');

  const positionField = data.schema.fields.find((field) => field.name === 'POSITION');
  t.equal(positionField.type.listSize, 3, 'schema size correct');
  t.equal(positionField.type.valueType.precision, 32, 'schema type correct');

  const colorField = data.schema.fields.find((field) => field.name === 'COLOR_0');
  t.equal(colorField.type.listSize, 3, 'schema size correct');
  t.equal(colorField.type.valueType.bitWidth, 8, 'schema type correct');
  t.equal(colorField.type.valueType.isSigned, false, 'schema type correct');

  t.equal(data.mode, 0, 'mode is POINTS (0)');
  t.notOk(data.indices, 'INDICES attribute was not found');

  t.equal(data.attributes.POSITION.value.length, 639, 'POSITION attribute was found');
  t.equal(data.attributes.COLOR_0.value.length, 639, 'COLOR attribute was found');

  t.end();
});

test('PCDLoader#parse(binary)', async (t) => {
  const data = await parse(fetchFile(PCD_BINARY_URL), PCDLoader, {worker: false});
  validateMeshCategoryData(t, data);

  t.equal(data.mode, 0, 'mode is POINTS (0)');
  t.notOk(data.indices, 'indices were not preset');
  t.notOk(data.attributes.COLOR_0, 'COLOR_0 attribute was not preset');
  t.notOk(data.attributes.NORMAL, 'NORMAL attribute was not preset');
  t.equal(data.attributes.POSITION.value.length, 179250, 'POSITION attribute was found');

  t.end();
});

test('PCDWorkerLoader#parse(binary)', async (t) => {
  if (typeof Worker === 'undefined') {
    t.comment('Worker is not usable in non-browser environments');
    t.end();
    return;
  }

  const data = await load(PCD_BINARY_URL, PCDWorkerLoader);
  validateMeshCategoryData(t, data);

  t.equal(data.mode, 0, 'mode is POINTS (0)');
  t.notOk(data.indices, 'indices were not preset');
  t.notOk(data.attributes.COLOR_0, 'COLOR_0 attribute was not preset');
  t.notOk(data.attributes.NORMAL, 'NORMAL attribute was not preset');
  t.equal(data.attributes.POSITION.value.length, 179250, 'POSITION attribute was found');
  t.end();
});
