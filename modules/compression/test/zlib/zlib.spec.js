import test from 'tape-promise/tape';
import {ZlibDeflateTransform, ZlibInflateTransform} from '@loaders.gl/compression';
import {makeTransformIterator, concatenateArrayBuffers} from '@loaders.gl/loader-utils';
import {generateRandomArrayBuffer, compareArrayBuffers} from '../utils/test-utils';

const SIZE = 100 * 1000;
const data = null;

// Avoid creating data in global scope
function getData() {
  if (data) {
    return data;
  }
  return {
    binaryData: generateRandomArrayBuffer({size: SIZE}),
    repeatedData: generateRandomArrayBuffer({size: SIZE / 10, repetitions: 10})
  };
}

test('zlib#defaults', t => {
  const {binaryData, repeatedData} = getData();

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

test('zlib@transforms', async t => {
  const inputChunks = [
    new Uint8Array([1, 2, 3]).buffer,
    new Uint8Array([4, 5, 6]).buffer,
    new Uint8Array([7, 8, 9]).buffer
  ];

  // @ts-ignore
  const deflateIterator = makeTransformIterator(inputChunks, ZlibDeflateTransform);
  // @ts-ignore
  const inflateIterator = makeTransformIterator(deflateIterator, ZlibInflateTransform);

  const inflatedChunks = [];
  for await (const chunk of inflateIterator) {
    inflatedChunks.push(chunk);
  }

  const inputData = concatenateArrayBuffers(...inputChunks);
  const inflatedData = concatenateArrayBuffers(...inflatedChunks);

  t.ok(compareArrayBuffers(inputData, inflatedData), 'deflate/inflate default options');

  t.end();
});

test('zlib#0', t => {
  const {binaryData} = getData();
  const deflatedData = ZlibDeflateTransform.deflateSync(binaryData, {level: 0});
  const inflatedData = ZlibInflateTransform.inflateSync(deflatedData);
  t.ok(compareArrayBuffers(binaryData, inflatedData), 'deflate/inflate level 0');
  t.end();
});

test('zlib#1', t => {
  const {binaryData} = getData();
  const deflatedData = ZlibDeflateTransform.deflateSync(binaryData, {level: 1});
  const inflatedData = ZlibInflateTransform.inflateSync(deflatedData);
  t.ok(compareArrayBuffers(binaryData, inflatedData), 'deflate/inflate level 1');
  t.end();
});

test('zlib#4', t => {
  const {binaryData} = getData();
  const deflatedData = ZlibDeflateTransform.deflateSync(binaryData, {level: 4});
  const inflatedData = ZlibInflateTransform.inflateSync(deflatedData);
  t.ok(compareArrayBuffers(binaryData, inflatedData), 'deflate/inflate level 4');
  t.end();
});

test('zlib#6', t => {
  const {binaryData} = getData();
  const deflatedData = ZlibDeflateTransform.deflateSync(binaryData, {level: 6});
  const inflatedData = ZlibInflateTransform.inflateSync(deflatedData);
  t.ok(compareArrayBuffers(binaryData, inflatedData), 'deflate/inflate level 6');
  t.end();
});
