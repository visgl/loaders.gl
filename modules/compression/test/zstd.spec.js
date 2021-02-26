import test from 'tape-promise/tape';
// import {ZstdDeflateTransform, ZstdInflateTransform} from '@loaders.gl/compression';
import {ZstdWorker} from '@loaders.gl/compression';
import {processOnWorker, isBrowser} from '@loaders.gl/worker-utils';
// import {generateRandomArrayBufferreArrayBuffers} from '../utils/test-utils';
import {getData, compareArrayBuffers} from './utils/test-utils';

/*
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
*/

// WORKER TESTS

test('zstd#worker', async t => {
  if (!isBrowser) {
    t.end();
    return;
  }

  const {binaryData} = getData();

  t.equal(binaryData.byteLength, 100000, 'Length correct');

  const deflatedData = await processOnWorker(ZstdWorker, binaryData.slice(0), {
    operation: 'deflate',
    _workerType: 'test'
  });

  t.equal(deflatedData.byteLength, 11936, 'Length correct');

  const inflatedData = await processOnWorker(ZstdWorker, deflatedData, {
    operation: 'inflate',
    _workerType: 'test'
  });

  t.equal(inflatedData.byteLength, 100000, 'Length correct');

  t.ok(compareArrayBuffers(inflatedData, binaryData), 'deflate/inflate level 6');
  t.end();
});
