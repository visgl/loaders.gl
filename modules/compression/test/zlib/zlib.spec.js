import test from 'tape-promise/tape';
import {ZlibDeflateTransform, ZlibInflateTransform} from '@loaders.gl/compression';
import {generateRandomArrayBuffer, compareArrayBuffers} from '../utils/test-utils';

const SIZE = 100 * 1000;
const binaryData = generateRandomArrayBuffer({size: SIZE});
const repeatedData = generateRandomArrayBuffer({size: SIZE / 10, repetitions: 10});

test('lz4#defaults', t => {
  let deflatedData = ZlibDeflateTransform.deflateSync(binaryData);
  let inflatedData = ZlibInflateTransform.inflateSync(deflatedData);
  t.ok(compareArrayBuffers(binaryData, inflatedData), 'deflate/inflate default options');

  t.equal(repeatedData.byteLength, 100000, 'Repeated data length is correct');
  deflatedData = ZlibDeflateTransform.deflateSync(repeatedData);
  t.equal(deflatedData.byteLength, 10903, 'Repeated data compresses well');
  inflatedData = ZlibInflateTransform.inflateSync(deflatedData);
  t.equal(inflatedData.byteLength, 100000, 'Inflated data length is correct');
  t.ok(compareArrayBuffers(repeatedData, inflatedData), 'deflate/inflate default options');

  t.end();
});

test('zlib#0', t => {
  const deflatedData = ZlibDeflateTransform.deflateSync(binaryData, {level: 0});
  const inflatedData = ZlibInflateTransform.inflateSync(deflatedData);
  t.ok(compareArrayBuffers(binaryData, inflatedData), 'deflate/inflate level 0');
  t.end();
});

test('zlib#1', t => {
  const deflatedData = ZlibDeflateTransform.deflateSync(binaryData, {level: 1});
  const inflatedData = ZlibInflateTransform.inflateSync(deflatedData);
  t.ok(compareArrayBuffers(binaryData, inflatedData), 'deflate/inflate level 1');
  t.end();
});

test('zlib#4', t => {
  const deflatedData = ZlibDeflateTransform.deflateSync(binaryData, {level: 4});
  const inflatedData = ZlibInflateTransform.inflateSync(deflatedData);
  t.ok(compareArrayBuffers(binaryData, inflatedData), 'deflate/inflate level 4');
  t.end();
});

test('zlib#6', t => {
  const deflatedData = ZlibDeflateTransform.deflateSync(binaryData, {level: 6});
  const inflatedData = ZlibInflateTransform.inflateSync(deflatedData);
  t.ok(compareArrayBuffers(binaryData, inflatedData), 'deflate/inflate level 6');
  t.end();
});
