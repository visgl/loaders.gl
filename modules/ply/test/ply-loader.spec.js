/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {fetchFile, parseFile, parseFileSync, loadFile} from '@loaders.gl/core';
import {getStreamIterator} from '@loaders.gl/core';

import {PLYLoader, PLYWorkerLoader, _PLYStreamLoader} from '@loaders.gl/ply';
import {validateLoadedData} from 'test/common/conformance';

const PLY_CUBE_ATT_URL = '@loaders.gl/ply/test/data/cube_att.ply';
const PLY_BUN_ZIPPER_URL = '@loaders.gl/ply/test/data/bun_zipper.ply';
const PLY_BUN_BINARY_URL = '@loaders.gl/ply/test/data/bunny.ply';

function validateTextPLY(t, data) {
  t.equal(data.indices.value.length, 36, 'Indices found');
  t.equal(data.attributes.POSITION.value.length, 72, 'POSITION attribute was found');
  t.equal(data.attributes.NORMAL.value.length, 72, 'NORMAL attribute was found');
}

test('PLYLoader#parse(textFile)', async t => {
  const data = await parseFile(fetchFile(PLY_CUBE_ATT_URL), PLYLoader, {});

  validateLoadedData(t, data);
  validateTextPLY(t, data);
  t.end();
});

test('PLYLoader#parse(binary)', async t => {
  const data = await parseFile(fetchFile(PLY_BUN_BINARY_URL), PLYLoader);

  validateLoadedData(t, data);
  t.equal(data.attributes.POSITION.value.length, 104502, 'POSITION attribute was found');
  t.end();
});

test('PLYLoader#parse(ascii)', async t => {
  const data = await parseFile(fetchFile(PLY_BUN_ZIPPER_URL), PLYLoader);

  validateLoadedData(t, data);
  t.equal(data.attributes.POSITION.value.length, 107841, 'POSITION attribute was found');
  t.end();
});

test('PLYLoader#parseFileSync(binary)', async t => {
  const arrayBuffer = await fetchFile(PLY_BUN_ZIPPER_URL).then(res => res.arrayBuffer());
  const data = parseFileSync(arrayBuffer, PLYLoader);

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

  const data = await loadFile(PLY_BUN_ZIPPER_URL, PLYWorkerLoader);

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
