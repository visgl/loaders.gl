// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {
  validateLoader,
  validateMeshCategoryData,
  validateTableCategoryData
} from 'test/common/conformance';

import {LASLoader, LASWorkerLoader} from '@loaders.gl/las';
import * as las from '@loaders.gl/las';
import * as bundledLas from '@loaders.gl/las/bundled';
import * as unbundledLas from '@loaders.gl/las/unbundled';
import {setLoaderOptions, fetchFile, parse, load} from '@loaders.gl/core';
// import {ArrowLoader} from '@loaders.gl/arrow';

const LAS_BINARY_URL = '@loaders.gl/las/test/data/indoor.laz';
const LAS_EXTRABYTES_BINARY_URL = '@loaders.gl/las/test/data/extrabytes.laz';

setLoaderOptions({
  _workerType: 'test'
});

test('LASLoader#loader conformance', t => {
  validateLoader(t, LASLoader, 'LASLoader');
  validateLoader(t, LASWorkerLoader, 'LASWorkerLoader');
  t.end();
});

test('LASLoader#removed Arrow variant exports are absent', t => {
  t.notOk('LASArrowLoader' in las, 'root does not export LASArrowLoader');
  t.notOk('LASArrowLoader' in bundledLas, 'bundled does not export LASArrowLoader');
  t.notOk('LASArrowLoader' in unbundledLas, 'unbundled does not export LASArrowLoader');
  t.end();
});

test('LASLoader#parse(binary)', async t => {
  const data = await parse(fetchFile(LAS_BINARY_URL), LASLoader, {
    las: {skip: 10},
    core: {worker: false}
  });
  validateMeshCategoryData(t, data);

  t.is(data.header?.vertexCount, data.loaderData.totalRead, 'Original header was found');
  t.equal(data.mode, 0, 'mode is POINTS (0)');

  t.notOk(data.indices, 'INDICES attribute was not preset');
  t.equal(data.attributes.POSITION.value.length, 80805 * 3, 'POSITION attribute was found');

  t.end();
});

test('LASLoader#options', async t => {
  const data = await parse(fetchFile(LAS_BINARY_URL), LASLoader, {
    las: {skip: 100, fp64: false},
    core: {worker: false}
  });
  t.ok(
    data.attributes.POSITION.value instanceof Float32Array,
    'POSITION attribute is Float32Array'
  );

  const data64 = await parse(fetchFile(LAS_BINARY_URL), LASLoader, {
    las: {skip: 100, fp64: true},
    core: {worker: false}
  });
  t.ok(
    data64.attributes.POSITION.value instanceof Float64Array,
    'POSITION attribute is Float64Array'
  );

  t.end();
});

test('LASWorker#parse(binary) extra bytes', async t => {
  const data = await parse(fetchFile(LAS_EXTRABYTES_BINARY_URL), LASLoader, {
    las: {skip: 10},
    core: {worker: false}
  });
  validateMeshCategoryData(t, data);

  t.is(data.header?.vertexCount, data.loaderData.totalRead, 'Original header was found');
  t.equal(data.mode, 0, 'mode is POINTS (0)');

  t.notOk(data.indices, 'INDICES attribute was not preset');
  t.equal(data.attributes.POSITION.value.length, 107 * 3, 'POSITION attribute was found');

  t.end();
});

test('LASWorkerLoader#load(worker)', async t => {
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

test('LASLoader#shape="mesh"', async t => {
  const result = await parse(fetchFile(LAS_BINARY_URL), LASLoader, {las: {shape: 'mesh'}});
  validateMeshCategoryData(t, result);
  t.end();
});

// Related code was commented due to breaking pointcloud example on the website
test.skip('LASLoader#shape="columnar-table"', async t => {
  const result = await parse(fetchFile(LAS_BINARY_URL), LASLoader, {
    las: {shape: 'columnar-table'}
  });
  validateTableCategoryData(t, result);
  t.end();
});

test('LASLoader#shape="arrow-table"', async t => {
  const result = await parse(fetchFile(LAS_BINARY_URL), LASLoader, {
    las: {shape: 'arrow-table', skip: 10},
    core: {worker: false}
  });
  validateTableCategoryData(t, result);
  t.equal(result.shape, 'arrow-table', 'returns Arrow table shape');
  t.ok(result.data.getChild('POSITION'), 'returns POSITION column');
  t.end();
});
