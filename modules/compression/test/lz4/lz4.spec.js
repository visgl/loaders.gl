import test from 'tape-promise/tape';
import {LZ4DeflateTransform, LZ4InflateTransform} from '@loaders.gl/compression';
import {generateRandomArrayBuffer, compareArrayBuffers} from '../utils/test-utils';

const SIZE = 100 * 1000;

test('lz4#defaults', t => {
  const binaryData = generateRandomArrayBuffer({size: SIZE});
  const repeatedData = generateRandomArrayBuffer({size: SIZE / 10, repetitions: 10});

  let deflatedData = LZ4DeflateTransform.deflateSync(binaryData);
  let inflatedData = LZ4InflateTransform.inflateSync(deflatedData);
  t.ok(compareArrayBuffers(binaryData, inflatedData), 'deflate/inflate default options');

  t.equal(repeatedData.byteLength, 100000, 'Repeated data length is correct');
  deflatedData = LZ4DeflateTransform.deflateSync(repeatedData);
  t.equal(deflatedData.byteLength, 10422, 'Repeated data compresses well');
  inflatedData = LZ4InflateTransform.inflateSync(deflatedData);
  t.equal(inflatedData.byteLength, 100000, 'Inflated data length is correct');
  t.ok(compareArrayBuffers(repeatedData, inflatedData), 'deflate/inflate default options');

  t.end();
});
