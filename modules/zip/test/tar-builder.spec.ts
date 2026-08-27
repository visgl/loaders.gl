import {expect, test} from 'vitest';
import {validateBuilder} from 'test/common/conformance';
import {TarBuilder} from '@loaders.gl/zip';
import {isBrowser} from '@loaders.gl/core';
import {IMAGE_DATA_ARRAY} from './lib/test-cases';
test('Zip#TarBuilder conformance', () => {
  validateBuilder(TarBuilder, 'TarBuilder');
});
test('Zip#TarBuilder addFile', async () => {
  if (!isBrowser) {
    console.log('TarBuilder is not usable in non-browser environments');
    return;
  }
  const builder = new TarBuilder();
  builder.addFile('test.png', IMAGE_DATA_ARRAY.buffer);
  expect(builder.count, 'File added to archive').toBe(1);
  const tarArrayBuffer = await builder.build();
  expect(tarArrayBuffer.byteLength, 'Archive correct size').toBe(2048);
});
