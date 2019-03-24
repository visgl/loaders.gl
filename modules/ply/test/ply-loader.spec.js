/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {fetchFile, readFile, parseFileSync, parseFile, loadFile} from '@loaders.gl/core';
import {getStreamIterator} from '@loaders.gl/core';

import {PLYLoader, PLYWorkerLoader, _PLYStreamLoader} from '@loaders.gl/ply';
import {validateLoadedData} from 'test/common/conformance';

const PLY_CUBE_ATT_URL = '@loaders.gl/ply/test/data/cube_att.ply';
const PLY_BUN_ZIPPER_URL = '@loaders.gl/ply/test/data/bun_zipper.ply';

function validateTextPLY(t, data) {
  t.equal(data.indices.value.length, 36, 'Indices found');
  t.equal(data.attributes.POSITION.value.length, 72, 'POSITION attribute was found');
  t.equal(data.attributes.NORMAL.value.length, 72, 'NORMAL attribute was found');
}

test('PLYLoader#parse(textFile loaded as text)', async t => {
  const data = await loadFile(PLY_CUBE_ATT_URL, PLYLoader, {});

  validateLoadedData(t, data);
  validateTextPLY(t, data);
  t.end();
});

test('PLYLoader#parse(textFile loaded as binary)', async t => {
  const data = await loadFile(PLY_CUBE_ATT_URL, PLYLoader);

  validateLoadedData(t, data);
  validateTextPLY(t, data);
  t.end();
});

test('PLYLoader#parseFileSync(binary)', async t => {
  const arrayBuffer = await readFile(PLY_BUN_ZIPPER_URL);
  const data = parseFileSync(arrayBuffer, PLYLoader);

  validateLoadedData(t, data);
  t.equal(data.attributes.POSITION.value.length, 107841, 'POSITION attribute was found');
  t.end();
});

test('PLYLoader#parse(binary)', async t => {
  const arrayBuffer = await readFile(PLY_BUN_ZIPPER_URL);
  const data = await parseFile(arrayBuffer, PLYLoader);

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

  // Once binary is transferred to worker it cannot be read from the main thread
  // Duplicate it here to avoid breaking other tests
  const arrayBuffer = await readFile(PLY_BUN_ZIPPER_URL);
  const data = await parseFile(arrayBuffer, PLYWorkerLoader);

  validateLoadedData(t, data);
  t.equal(data.attributes.POSITION.value.length, 107841, 'POSITION attribute was found');
  t.end();
});

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
