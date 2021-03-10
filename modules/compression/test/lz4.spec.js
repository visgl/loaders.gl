import test from 'tape-promise/tape';
import {LZ4DeflateTransform, LZ4InflateTransform, LZ4Worker} from '@loaders.gl/compression';
import {processOnWorker, isBrowser} from '@loaders.gl/worker-utils';
import {getData, generateRandomArrayBuffer, compareArrayBuffers} from './utils/test-utils';

const SIZE = 100 * 1000;

test('lz4#defaults', async t => {
  const binaryData = generateRandomArrayBuffer({size: SIZE});
  const repeatedData = generateRandomArrayBuffer({size: SIZE / 10, repetitions: 10});

  let deflatedData = await LZ4DeflateTransform.run(binaryData);
  let inflatedData = await LZ4InflateTransform.run(deflatedData);
  t.ok(compareArrayBuffers(binaryData, inflatedData), 'deflate/inflate default options');

  t.equal(repeatedData.byteLength, 100000, 'Repeated data length is correct');
  deflatedData = await LZ4DeflateTransform.run(repeatedData);
  t.equal(deflatedData.byteLength, 10422, 'Repeated data compresses well');
  inflatedData = await LZ4InflateTransform.run(deflatedData);
  t.equal(inflatedData.byteLength, 100000, 'Inflated data length is correct');
  t.ok(compareArrayBuffers(repeatedData, inflatedData), 'deflate/inflate default options');

  t.end();
});

// WORKER TESTS

test('lz4#worker', async t => {
  if (!isBrowser) {
    t.end();
    return;
  }

  const {binaryData} = getData();

  t.equal(binaryData.byteLength, 100000, 'Length correct');

  const deflatedData = await processOnWorker(LZ4Worker, binaryData.slice(0), {
    operation: 'deflate',
    _workerType: 'test'
  });

  t.equal(deflatedData.byteLength, 12331, 'Length correct');

  const inflatedData = await processOnWorker(LZ4Worker, deflatedData, {
    operation: 'inflate',
    _workerType: 'test'
  });

  t.equal(inflatedData.byteLength, 100000, 'Length correct');

  t.ok(compareArrayBuffers(inflatedData, binaryData), 'deflate/inflate level 6');
  t.end();
});
