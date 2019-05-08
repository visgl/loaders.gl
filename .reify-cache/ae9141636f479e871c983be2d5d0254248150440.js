"use strict";var test;module.link('tape-promise/tape',{default(v){test=v}},0);var load;module.link('@loaders.gl/core',{load(v){load=v}},1);var DracoLoader,DracoWorkerLoader;module.link('@loaders.gl/draco',{DracoLoader(v){DracoLoader=v},DracoWorkerLoader(v){DracoWorkerLoader=v}},2);var validateLoadedData;module.link('test/common/conformance',{validateLoadedData(v){validateLoadedData=v}},3);/* eslint-disable max-len */





const BUNNY_DRC_URL = '@loaders.gl/draco/test/data/bunny.drc';

test('DracoLoader#parse and encode', async t => {
  const data = await load(BUNNY_DRC_URL, DracoLoader);
  validateLoadedData(t, data);
  t.equal(data.attributes.POSITION.value.length, 104502, 'POSITION attribute was found');

  t.end();
});

test('DracoWorkerLoader#parse', async t => {
  if (typeof Worker === 'undefined') {
    t.comment('Worker is not usable in non-browser environments');
    t.end();
    return;
  }

  const data = await load(BUNNY_DRC_URL, DracoWorkerLoader);
  validateLoadedData(t, data);
  t.equal(data.attributes.POSITION.value.length, 104502, 'POSITION attribute was found');

  t.end();
});
