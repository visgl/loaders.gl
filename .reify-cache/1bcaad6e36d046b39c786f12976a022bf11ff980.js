"use strict";var test;module.link('tape-promise/tape',{default(v){test=v}},0);var load;module.link('@loaders.gl/core',{load(v){load=v}},1);var OBJLoader,OBJWorkerLoader;module.link('@loaders.gl/obj',{OBJLoader(v){OBJLoader=v},OBJWorkerLoader(v){OBJWorkerLoader=v}},2);var validateLoadedData;module.link('test/common/conformance',{validateLoadedData(v){validateLoadedData=v}},3);/* eslint-disable max-len */




// Note: The Sublime Text Editor hides OBJ files from the file tree...


const OBJ_ASCII_URL = '@loaders.gl/obj/test/data/bunny.obj';
const OBJ_NORMALS_URL = '@loaders.gl/obj/test/data/cube.obj';
const OBJ_MULTI_PART_URL = '@loaders.gl/obj/test/data/magnolia.obj';

test('OBJLoader#parseText', async t => {
  const data = await load(OBJ_ASCII_URL, OBJLoader);
  validateLoadedData(t, data);

  t.equal(data.mode, 4, 'mode is TRIANGLES (4)');

  t.equal(data.attributes.POSITION.value.length, 14904 * 3, 'POSITION attribute was found');
  t.equal(data.attributes.POSITION.size, 3, 'POSITION attribute was found');

  t.end();
});

test('OBJLoader#parseText - object with normals', async t => {
  const data = await load(OBJ_NORMALS_URL, OBJLoader);
  validateLoadedData(t, data);

  t.equal(data.attributes.POSITION.value.length, 108, 'POSITION attribute was found');
  t.equal(data.attributes.POSITION.size, 3, 'POSITION attribute was found');
  t.equal(data.attributes.NORMAL.value.length, 108, 'NORMAL attribute was found');
  t.equal(data.attributes.NORMAL.size, 3, 'NORMAL attribute was found');
  t.equal(data.attributes.TEXCOORD_0.value.length, 72, 'TEXCOORD_0 attribute was found');
  t.equal(data.attributes.TEXCOORD_0.size, 2, 'TEXCOORD_0 attribute was found');
  t.end();
});

test('OBJLoader#parseText - multi-part object', async t => {
  const data = await load(OBJ_MULTI_PART_URL, OBJLoader);
  validateLoadedData(t, data);

  t.equal(data.header.vertexCount, 1372 * 3, 'Vertices are loaded');
  t.end();
});

test('OBJWorkerLoader#parse(text)', async t => {
  if (typeof Worker === 'undefined') {
    t.comment('Worker is not usable in non-browser environments');
    t.end();
    return;
  }

  const data = await load(OBJ_ASCII_URL, OBJWorkerLoader);

  validateLoadedData(t, data);

  t.equal(data.mode, 4, 'mode is TRIANGLES (4)');

  t.equal(data.attributes.POSITION.value.length, 14904 * 3, 'POSITION attribute was found');
  t.equal(data.attributes.POSITION.size, 3, 'POSITION attribute was found');
  t.end();
});
