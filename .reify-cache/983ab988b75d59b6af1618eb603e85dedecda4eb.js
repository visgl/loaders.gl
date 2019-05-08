"use strict";var test;module.link('tape-promise/tape',{default(v){test=v}},0);var fetchFile,parse,parseSync,load;module.link('@loaders.gl/core',{fetchFile(v){fetchFile=v},parse(v){parse=v},parseSync(v){parseSync=v},load(v){load=v}},1);var getStreamIterator;module.link('@loaders.gl/core',{getStreamIterator(v){getStreamIterator=v}},2);var PLYLoader,PLYWorkerLoader,_PLYStreamLoader;module.link('@loaders.gl/ply',{PLYLoader(v){PLYLoader=v},PLYWorkerLoader(v){PLYWorkerLoader=v},_PLYStreamLoader(v){_PLYStreamLoader=v}},3);var validateLoadedData;module.link('test/common/conformance',{validateLoadedData(v){validateLoadedData=v}},4);/* eslint-disable max-len */







const PLY_CUBE_ATT_URL = '@loaders.gl/ply/test/data/cube_att.ply';
const PLY_BUN_ZIPPER_URL = '@loaders.gl/ply/test/data/bun_zipper.ply';
const PLY_BUN_BINARY_URL = '@loaders.gl/ply/test/data/bunny.ply';

function validateTextPLY(t, data) {
  t.equal(data.indices.value.length, 36, 'Indices found');
  t.equal(data.attributes.POSITION.value.length, 72, 'POSITION attribute was found');
  t.equal(data.attributes.NORMAL.value.length, 72, 'NORMAL attribute was found');
}

test('PLYLoader#parse(textFile)', async t => {
  const data = await parse(fetchFile(PLY_CUBE_ATT_URL), PLYLoader, {});

  validateLoadedData(t, data);
  validateTextPLY(t, data);
  t.end();
});

test('PLYLoader#parse(binary)', async t => {
  const data = await parse(fetchFile(PLY_BUN_BINARY_URL), PLYLoader);

  validateLoadedData(t, data);
  t.equal(data.attributes.POSITION.value.length, 104502, 'POSITION attribute was found');
  t.end();
});

test('PLYLoader#parse(ascii)', async t => {
  const data = await parse(fetchFile(PLY_BUN_ZIPPER_URL), PLYLoader);

  validateLoadedData(t, data);
  t.equal(data.attributes.POSITION.value.length, 107841, 'POSITION attribute was found');
  t.end();
});

test('PLYLoader#parseSync(binary)', async t => {
  const arrayBuffer = await fetchFile(PLY_BUN_ZIPPER_URL).then(res => res.arrayBuffer());
  const data = parseSync(arrayBuffer, PLYLoader);

  validateLoadedData(t, data);
  t.equal(data.attributes.POSITION.value.length, 107841, 'POSITION attribute was found');
  t.end();
});

test('PLYLoader#parse(WORKER)', async t => {
  if (typeof Worker === 'undefined') {
    t.comment('Worker is not usable in non-browser environments');
    t.end();
    return;
  }

  const data = await load(PLY_BUN_ZIPPER_URL, PLYWorkerLoader);

  validateLoadedData(t, data);
  t.equal(data.attributes.POSITION.value.length, 107841, 'POSITION attribute was found');
  t.end();
});

// TODO - Update to use parseInBatches
test('PLYLoader#parseStream(text)', async t => {
  const response = await fetchFile(PLY_CUBE_ATT_URL);
  const stream = await response.body;

  const data = await _PLYStreamLoader.parseAsIterator(getStreamIterator(stream));

  validateLoadedData(t, data);
  t.equal(data.indices.value.length, 36, 'Indices found');
  t.equal(data.attributes.POSITION.value.length, 72, 'POSITION attribute was found');
  t.equal(data.attributes.NORMAL.value.length, 72, 'NORMAL attribute was found');
  t.end();
});
