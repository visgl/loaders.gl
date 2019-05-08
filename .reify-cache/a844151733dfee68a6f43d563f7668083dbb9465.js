"use strict";var test;module.link('tape-promise/tape',{default(v){test=v}},0);var fetchFile,parse,load;module.link('@loaders.gl/core',{fetchFile(v){fetchFile=v},parse(v){parse=v},load(v){load=v}},1);var LASLoader,LASWorkerLoader;module.link('@loaders.gl/las',{LASLoader(v){LASLoader=v},LASWorkerLoader(v){LASWorkerLoader=v}},2);var validateLoadedData;module.link('test/common/conformance',{validateLoadedData(v){validateLoadedData=v}},3);/* eslint-disable max-len */





const LAS_BINARY_URL = '@loaders.gl/las/test/data/indoor.laz';

test('LASLoader#parseBinary', async t => {
  const data = await parse(fetchFile(LAS_BINARY_URL), LASLoader, {skip: 10});
  validateLoadedData(t, data);

  t.is(data.header.vertexCount, data.loaderData.header.totalRead, 'Original header was found');
  t.equal(data.mode, 0, 'mode is POINTS (0)');

  t.notOk(data.indices, 'INDICES attribute was not preset');
  t.equal(data.attributes.POSITION.value.length, 80805 * 3, 'POSITION attribute was found');

  t.end();
});

test('LASWorkerLoader#parseBinary', async t => {
  if (typeof Worker === 'undefined') {
    t.comment('Worker is not usable in non-browser environments');
    t.end();
    return;
  }

  const data = await load(LAS_BINARY_URL, LASWorkerLoader, {skip: 10});
  validateLoadedData(t, data);

  t.equal(data.attributes.POSITION.value.length, 80805 * 3, 'POSITION attribute was found');
  t.end();
});
