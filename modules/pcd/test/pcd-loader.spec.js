/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {validateLoader, validateMeshCategoryData} from 'test/common/conformance';

import {PCDLoader, PCDWorkerLoader} from '@loaders.gl/pcd';
import {setLoaderOptions, fetchFile, parse, load} from '@loaders.gl/core';

const PCD_ASCII_URL = '@loaders.gl/pcd/test/data/simple-ascii.pcd';
const PCD_BINARY_URL = '@loaders.gl/pcd/test/data/Zaghetto.pcd';

setLoaderOptions({
  pcd: {
    workerUrl: 'modules/pcd/dist/pcd-loader.worker.js'
  }
});

test('PCDLoader#loader conformance', t => {
  validateLoader(t, PCDLoader, 'PCDLoader');
  validateLoader(t, PCDWorkerLoader, 'PCDWorkerLoader');
  t.end();
});

test('PCDLoader#parse(text)', async t => {
  const data = await parse(fetchFile(PCD_ASCII_URL), PCDLoader, {worker: false});
  validateMeshCategoryData(t, data);

  t.equal(data.mode, 0, 'mode is POINTS (0)');
  t.notOk(data.indices, 'INDICES attribute was not found');

  t.equal(data.attributes.POSITION.value.length, 639, 'POSITION attribute was found');
  t.equal(data.attributes.COLOR_0.value.length, 639, 'COLOR attribute was found');

  t.end();
});

test('PCDLoader#parse(binary)', async t => {
  const data = await parse(fetchFile(PCD_BINARY_URL), PCDLoader, {worker: false});
  validateMeshCategoryData(t, data);

  t.equal(data.mode, 0, 'mode is POINTS (0)');
  t.notOk(data.indices, 'indices were not preset');
  t.notOk(data.attributes.COLOR_0, 'COLOR_0 attribute was not preset');
  t.notOk(data.attributes.NORMAL, 'NORMAL attribute was not preset');
  t.equal(data.attributes.POSITION.value.length, 179250, 'POSITION attribute was found');

  t.end();
});

test('PCDWorkerLoader#parse(binary)', async t => {
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
