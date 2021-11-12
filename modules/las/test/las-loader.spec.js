/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {
  validateLoader,
  validateMeshCategoryData,
  validateTableCategoryData
} from 'test/common/conformance';

import {LASLoader, LASWorkerLoader} from '@loaders.gl/las';
import {setLoaderOptions, fetchFile, parse, load} from '@loaders.gl/core';
import {ArrowLoader} from '@loaders.gl/arrow';

const LAS_BINARY_URL = '@loaders.gl/las/test/data/indoor.laz';
const LAS_EXTRABYTES_BINARY_URL = '@loaders.gl/las/test/data/extrabytes.laz';

setLoaderOptions({
  _workerType: 'test'
});

test('LASLoader#loader conformance', (t) => {
  validateLoader(t, LASLoader, 'LASLoader');
  validateLoader(t, LASWorkerLoader, 'LASWorkerLoader');
  t.end();
});

test('LASLoader#parse(binary)', async (t) => {
  const data = await parse(fetchFile(LAS_BINARY_URL), LASLoader, {las: {skip: 10}, worker: false});
  validateMeshCategoryData(t, data);

  t.is(data.header.vertexCount, data.loaderData.totalRead, 'Original header was found');
  t.equal(data.mode, 0, 'mode is POINTS (0)');

  t.notOk(data.indices, 'INDICES attribute was not preset');
  t.equal(data.attributes.POSITION.value.length, 80805 * 3, 'POSITION attribute was found');

  t.end();
});

test('LASLoader#options', async (t) => {
  const data = await parse(fetchFile(LAS_BINARY_URL), LASLoader, {
    las: {skip: 100, fp64: false},
    worker: false
  });
  t.ok(
    data.attributes.POSITION.value instanceof Float32Array,
    'POSITION attribute is Float32Array'
  );

  const data64 = await parse(fetchFile(LAS_BINARY_URL), LASLoader, {
    las: {skip: 100, fp64: true},
    worker: false
  });
  t.ok(
    data64.attributes.POSITION.value instanceof Float64Array,
    'POSITION attribute is Float64Array'
  );

  t.end();
});

test('LASWorker#parse(binary) extra bytes', async (t) => {
  const data = await parse(fetchFile(LAS_EXTRABYTES_BINARY_URL), LASLoader, {
    las: {skip: 10},
    worker: false
  });
  validateMeshCategoryData(t, data);

  t.is(data.header.vertexCount, data.loaderData.totalRead, 'Original header was found');
  t.equal(data.mode, 0, 'mode is POINTS (0)');

  t.notOk(data.indices, 'INDICES attribute was not preset');
  t.equal(data.attributes.POSITION.value.length, 107 * 3, 'POSITION attribute was found');

  t.end();
});

test('LASWorkerLoader#load(worker)', async (t) => {
  if (typeof Worker === 'undefined') {
    t.comment('Worker is not usable in non-browser environments');
    t.end();
    return;
  }

  const data = await load(LAS_BINARY_URL, LASWorkerLoader, {las: {skip: 10}});
  validateMeshCategoryData(t, data);

  t.equal(data.attributes.POSITION.value.length, 80805 * 3, 'POSITION attribute was found');
  t.end();
});

test('LASLoader#shape="mesh"', async (t) => {
  const result = await parse(fetchFile(LAS_BINARY_URL), LASLoader, {las: {shape: 'mesh'}});
  validateMeshCategoryData(t, result);
  t.end();
});

test('LASLoader#shape="columnar-table"', async (t) => {
  const result = await parse(fetchFile(LAS_BINARY_URL), LASLoader, {
    las: {shape: 'columnar-table'}
  });
  validateTableCategoryData(t, result);
  t.end();
});

test.skip('LAS#shape="arrow-table"', async (t) => {
  const result = await parse(fetchFile(LAS_BINARY_URL), LASLoader, {
    las: {shape: 'arrow-table', skip: 10},
    worker: false
  });
  t.ok(result);

  const table = result.data;
  const arrowData = await parse(table.serialize(), ArrowLoader);
  t.ok(arrowData);
  t.equals(arrowData.classification.length, 80805);
  t.ok(
    arrowData.classification[0].data.values instanceof Uint8Array,
    'arrowData.classification value is instance of `Uint8Vector`'
  );
  t.equals(arrowData.classification[0].data.values.length, 1);

  t.equals(arrowData.COLOR_0.length, 80805);
  t.ok(
    arrowData.COLOR_0[0].data.values instanceof Uint8Array,
    'arrowData.COLOR_0 value is instance of `Uint8Vector`'
  );
  t.equals(arrowData.COLOR_0[0].data.values.length, 4);

  t.equals(arrowData.intensity.length, 80805);
  t.ok(
    arrowData.intensity[0].data.values instanceof Uint16Array,
    'arrowData.intensity value is instance of `Uint16Vector`'
  );
  t.equals(arrowData.intensity[0].data.values.length, 1);

  t.equals(arrowData.POSITION.length, 80805);
  t.ok(
    arrowData.POSITION[0].data.values instanceof Float32Array,
    'arrowData.POSITION value is instance of `Float32Vector`'
  );
  t.equals(arrowData.POSITION[0].data.values.length, 3);
  t.end();
});
