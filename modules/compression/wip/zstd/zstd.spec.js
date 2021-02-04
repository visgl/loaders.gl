import test from 'tape-promise/tape';
import {ZstdDeflateTransform, ZstdInflateTransform} from '@loaders.gl/compression';
import {generateRandomArrayBuffer, compareArrayBuffers} from '../utils/test-utils';

const SIZE = 100 * 1000;

test('lz4#defaults', async t => {
  const binaryData = generateRandomArrayBuffer({size: SIZE});
  const repeatedData = generateRandomArrayBuffer({size: SIZE / 10, repetitions: 10});

  let deflatedData = await ZstdDeflateTransform.deflate(binaryData);
  let inflatedData = await ZstdInflateTransform.inflate(deflatedData);
  t.ok(compareArrayBuffers(binaryData, inflatedData), 'deflate/inflate default options');

  t.equal(repeatedData.byteLength, 100000, 'Repeated data length is correct');
  deflatedData = await ZstdDeflateTransform.deflate(repeatedData);
  t.equal(deflatedData.byteLength, 10025, 'Repeated data compresses well');
  inflatedData = await ZstdInflateTransform.inflate(deflatedData);
  t.equal(inflatedData.byteLength, 100000, 'Inflated data length is correct');
  t.ok(compareArrayBuffers(repeatedData, inflatedData), 'deflate/inflate default options');

  t.end();
});
