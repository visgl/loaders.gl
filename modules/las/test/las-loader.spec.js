/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {validateLoader, validatePointCloudCategoryData} from 'test/common/conformance';

import {LASLoader, LASWorkerLoader} from '@loaders.gl/las';
import {setLoaderOptions, fetchFile, parse, load} from '@loaders.gl/core';

const LAS_BINARY_URL = '@loaders.gl/las/test/data/indoor.laz';

setLoaderOptions({
  las: {
    workerUrl: 'modules/las/dist/las-loader.worker.js'
  }
});

test('LASLoader#loader conformance', t => {
  validateLoader(t, LASLoader, 'LASLoader');
  validateLoader(t, LASWorkerLoader, 'LASWorkerLoader');
  t.end();
});

test('LASLoader#parse(binary)', async t => {
  const data = await parse(fetchFile(LAS_BINARY_URL), LASLoader, {las: {skip: 10}, worker: false});
  validatePointCloudCategoryData(t, data);

  t.is(data.header.vertexCount, data.loaderData.header.totalRead, 'Original header was found');
  t.equal(data.mode, 0, 'mode is POINTS (0)');

  t.notOk(data.indices, 'INDICES attribute was not preset');
  t.equal(data.attributes.POSITION.value.length, 80805 * 3, 'POSITION attribute was found');

  t.end();
});

test('LASWorkerLoader#load(worker)', async t => {
  if (typeof Worker === 'undefined') {
    t.comment('Worker is not usable in non-browser environments');
    t.end();
    return;
  }

  const data = await load(LAS_BINARY_URL, LASWorkerLoader, {
    las: {
      workerUrl: 'modules/las/dist/las-loader.worker.js',
      skip: 10
    }
  });
  validatePointCloudCategoryData(t, data);

  t.equal(data.attributes.POSITION.value.length, 80805 * 3, 'POSITION attribute was found');
  t.end();
});
