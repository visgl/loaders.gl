"use strict";var test;module.link('tape-promise/tape',{default(v){test=v}},0);var fetchFile,parse,load;module.link('@loaders.gl/core',{fetchFile(v){fetchFile=v},parse(v){parse=v},load(v){load=v}},1);var PCDLoader,PCDWorkerLoader;module.link('@loaders.gl/pcd',{PCDLoader(v){PCDLoader=v},PCDWorkerLoader(v){PCDWorkerLoader=v}},2);var validateLoadedData;module.link('test/common/conformance',{validateLoadedData(v){validateLoadedData=v}},3);/* eslint-disable max-len */






const PCD_ASCII_URL = '@loaders.gl/pcd/test/data/simple-ascii.pcd';
const PCD_BINARY_URL = '@loaders.gl/pcd/test/data/Zaghetto.pcd';

test('PCDLoader#parse(text)', async t => {
  const data = await parse(fetchFile(PCD_ASCII_URL), PCDLoader);
  validateLoadedData(t, data);

  t.equal(data.mode, 0, 'mode is POINTS (0)');
  t.notOk(data.indices, 'INDICES attribute was not found');

  t.equal(data.attributes.POSITION.value.length, 639, 'POSITION attribute was found');
  t.equal(data.attributes.COLOR_0.value.length, 639, 'COLOR attribute was found');

  t.end();
});

test('PCDLoader#parse(binary)', async t => {
  const data = await parse(fetchFile(PCD_BINARY_URL), PCDLoader);
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

  const data = await load(PCD_BINARY_URL, PCDWorkerLoader);
  validateLoadedData(t, data);

  t.equal(data.mode, 0, 'mode is POINTS (0)');
  t.notOk(data.indices, 'INDICES attribute was not preset');
  t.equal(data.attributes.POSITION.value.length, 179250, 'POSITION attribute was found');
  t.end();
});
