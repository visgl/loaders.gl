/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {loadFile, getGLTFAttribute} from '@loaders.gl/core';
import {OBJLoader, OBJWorkerLoader} from '@loaders.gl/obj';

// Note: The Sublime Text Editor hides OBJ files from the file tree...
import {validateLoadedData} from 'test/common/conformance';

const OBJ_ASCII_URL = '@loaders.gl/obj/test/data/bunny.obj';

test('OBJLoader#parseText', async t => {
  const data = await loadFile(OBJ_ASCII_URL, OBJLoader);
  validateLoadedData(t, data);

  t.equal(data.mode, 4, 'mode is TRIANGLES (4)');
  t.equal(data.indices.value.length, 14904, 'INDICES attribute was found');
  t.equal(data.indices.count, 14904, 'INDICES attribute was found');

  t.equal(getGLTFAttribute(data, 'POSITION').value.length, 7509, 'POSITION attribute was found');
  t.equal(getGLTFAttribute(data, 'POSITION').size, 3, 'POSITION attribute was found');

  // TODO - need OBJ test model with normals and uvs
  // const NORMAL = data.glTFAttributeMap.NORMAL;
  // const TEXCOORD_0 = data.glTFAttributeMap.TEXCOORD_0;
  // t.equal(data.attributes[NORMAL].value.length, 7509, 'NORMAL attribute was found');
  // t.equal(data.attributes[NORMAL].size, 3, 'NORMAL attribute was found');
  // t.equal(data.attributes[TEXCOORD_0].value.length, 7509, 'TEXCOORD_0 attribute was found');
  // t.equal(data.attributes[TEXCOORD_0].size, 3, 'TEXCOORD_0 attribute was found');

  t.end();
});

test('OBJWorkerLoader#parse(text)', async t => {
  if (typeof Worker === 'undefined') {
    t.comment('Worker is not usable in non-browser environments');
    t.end();
    return;
  }

  const data = await loadFile(OBJ_ASCII_URL, OBJWorkerLoader);

  validateLoadedData(t, data);

  t.equal(data.mode, 4, 'mode is TRIANGLES (4)');
  t.equal(data.indices.value.length, 14904, 'INDICES attribute was found');
  t.equal(data.indices.count, 14904, 'INDICES attribute was found');

  t.equal(getGLTFAttribute(data, 'POSITION').value.length, 7509, 'POSITION attribute was found');
  t.equal(getGLTFAttribute(data, 'POSITION').size, 3, 'POSITION attribute was found');
  t.end();
});
