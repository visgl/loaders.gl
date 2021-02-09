/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {validateLoader, validateMeshCategoryData} from 'test/common/conformance';

import {PLYLoader, PLYWorkerLoader} from '@loaders.gl/ply';
import {
  setLoaderOptions,
  fetchFile,
  load,
  parse,
  parseSync,
  parseInBatches
} from '@loaders.gl/core';
import {makeIterator} from '@loaders.gl/core';

const PLY_CUBE_ATT_URL = '@loaders.gl/ply/test/data/cube_att.ply';
const PLY_BUN_ZIPPER_URL = '@loaders.gl/ply/test/data/bun_zipper.ply';
const PLY_BUN_BINARY_URL = '@loaders.gl/ply/test/data/bunny.ply';

setLoaderOptions({
  _workerType: 'test'
});

function validateTextPLY(t, data) {
  t.equal(data.indices.value.length, 36, 'Indices found');
  t.equal(data.attributes.POSITION.value.length, 72, 'POSITION attribute was found');
  t.equal(data.attributes.NORMAL.value.length, 72, 'NORMAL attribute was found');
}

test('PLYLoader#loader conformance', t => {
  validateLoader(t, PLYLoader, 'PLYLoader');
  validateLoader(t, PLYWorkerLoader, 'PLYWorkerLoader');
  t.end();
});

test('PLYLoader#parse(textFile)', async t => {
  const data = await parse(fetchFile(PLY_CUBE_ATT_URL), PLYLoader, {});

  validateMeshCategoryData(t, data);
  validateTextPLY(t, data);
  t.end();
});

test('PLYLoader#parse(binary)', async t => {
  const data = await parse(fetchFile(PLY_BUN_BINARY_URL), PLYLoader);

  validateMeshCategoryData(t, data);
  t.equal(data.attributes.POSITION.value.length, 104502, 'POSITION attribute was found');
  t.end();
});

test('PLYLoader#parse(ascii)', async t => {
  const data = await parse(fetchFile(PLY_BUN_ZIPPER_URL), PLYLoader);

  validateMeshCategoryData(t, data);
  t.equal(data.attributes.POSITION.value.length, 107841, 'POSITION attribute was found');
  t.end();
});

test('PLYLoader#parseSync(binary)', async t => {
  const arrayBuffer = await fetchFile(PLY_BUN_ZIPPER_URL).then(res => res.arrayBuffer());
  const data = parseSync(arrayBuffer, PLYLoader);

  validateMeshCategoryData(t, data);
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

  validateMeshCategoryData(t, data);
  t.equal(data.attributes.POSITION.value.length, 107841, 'POSITION attribute was found');
  t.end();
});

// TODO - Update to use parseInBatches
test('PLYLoader#parseInBatches(text)', async t => {
  const response = await fetchFile(PLY_CUBE_ATT_URL);
  const batches = await parseInBatches(makeIterator(response), PLYLoader);

  for await (const data of batches) {
    validateMeshCategoryData(t, data);
    t.equal(data.indices.value.length, 36, 'Indices found');
    t.equal(data.attributes.POSITION.value.length, 72, 'POSITION attribute was found');
    t.equal(data.attributes.NORMAL.value.length, 72, 'NORMAL attribute was found');
    t.end();
    return;
  }
});
