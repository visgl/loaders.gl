/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {fetchFile, parseFile, loadFile} from '@loaders.gl/core';
import {PCDLoader, PCDWorkerLoader} from '@loaders.gl/pcd';

import {validateLoadedData} from 'test/common/conformance';

const PCD_ASCII_URL = '@loaders.gl/pcd/test/data/simple-ascii.pcd';
const PCD_BINARY_URL = '@loaders.gl/pcd/test/data/Zaghetto.pcd';

test('PCDLoader#parse(text)', async t => {
  const data = await parseFile(fetchFile(PCD_ASCII_URL), PCDLoader);
  validateLoadedData(t, data);

  t.equal(data.mode, 0, 'mode is POINTS (0)');
  t.notOk(data.indices, 'INDICES attribute was not found');

  t.equal(data.attributes.POSITION.value.length, 639, 'POSITION attribute was found');
  t.equal(data.attributes.COLOR_0.value.length, 639, 'COLOR attribute was found');

  t.end();
});

test('PCDLoader#parse(binary)', async t => {
  const data = await parseFile(fetchFile(PCD_BINARY_URL), PCDLoader);
  validateLoadedData(t, data);

  t.equal(data.mode, 0, 'mode is POINTS (0)');
  t.notOk(data.indices, 'INDICES attribute was not preset');
  t.equal(data.attributes.POSITION.value.length, 179250, 'POSITION attribute was found');

  t.end();
});

test('PCDWorkerLoader#parse(binary)', async t => {
  if (typeof Worker === 'undefined') {
    t.comment('Worker is not usable in non-browser environments');
    t.end();
    return;
  }

  const data = await loadFile(PCD_BINARY_URL, PCDWorkerLoader);
  validateLoadedData(t, data);

  t.equal(data.mode, 0, 'mode is POINTS (0)');
  t.notOk(data.indices, 'INDICES attribute was not preset');
  t.equal(data.attributes.POSITION.value.length, 179250, 'POSITION attribute was found');
  t.end();
});
