import test from 'tape-promise/tape';
import {validateBuilder} from 'test/common/conformance';

import {TarBuilder} from '@loaders.gl/zip';
import {isBrowser} from '@loaders.gl/core';

import {IMAGE_DATA_ARRAY} from './lib/test-cases';

test('Zip#TarBuilder conformance', (t) => {
  validateBuilder(t, TarBuilder, 'TarBuilder');
  t.end();
});

test('Zip#TarBuilder addFile', async (t) => {
  if (!isBrowser) {
    t.comment('TarBuilder is not usable in non-browser environments');
    t.end();
    return;
  }
  const builder = new TarBuilder();
  builder.addFile('test.png', IMAGE_DATA_ARRAY.buffer);
  t.equal(builder.count, 1, 'File added to archive');
  const tarArrayBuffer = await builder.build();
  t.equal(tarArrayBuffer.byteLength, 2048, 'Archive correct size');
  t.end();
});
