/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {validateLoader, validatePointCloudCategoryData} from 'test/common/conformance';

import {fetchFile, parse, load} from '@loaders.gl/core';
import {LASLoader, LASWorkerLoader} from '@loaders.gl/las';

const LAS_BINARY_URL = '@loaders.gl/las/test/data/indoor.laz';

test('LASLoader#loader conformance', t => {
  validateLoader(t, LASLoader, 'LASLoader');
  validateLoader(t, LASWorkerLoader, 'LASWorkerLoader');
  t.end();
});

test('LASLoader#parseBinary', async t => {
  const data = await parse(fetchFile(LAS_BINARY_URL), LASLoader, {skip: 10});
  validatePointCloudCategoryData(t, data);

  t.is(data.header.vertexCount, data.loaderData.header.totalRead, 'Original header was found');
  t.equal(data.mode, 0, 'mode is POINTS (0)');

  t.notOk(data.indices, 'INDICES attribute was not preset');
  t.equal(data.attributes.POSITION.value.length, 80805 * 3, 'POSITION attribute was found');

  t.end();
});

test('LASWorkerLoader#parseBinary', async t => {
  if (typeof Worker === 'undefined') {
    t.comment('Worker is not usable in non-browser environments');
    t.end();
    return;
  }

  const data = await load(LAS_BINARY_URL, LASWorkerLoader, {skip: 10});
  validatePointCloudCategoryData(t, data);

  t.equal(data.attributes.POSITION.value.length, 80805 * 3, 'POSITION attribute was found');
  t.end();
});
