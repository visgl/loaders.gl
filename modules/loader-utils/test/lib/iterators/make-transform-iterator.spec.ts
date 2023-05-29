import test from 'tape-promise/tape';
import {concatenateArrayBuffers} from '@loaders.gl/loader-utils';
import {fetchFile, parseInBatches, makeIterator} from '@loaders.gl/core';
import {ShapefileLoader} from '@loaders.gl/shapefile';
import {CRC32CHash} from '@loaders.gl/crypto';

const SHAPEFILE_URL = '@loaders.gl/shapefile/test/data/shapefile-js/boolean-property.shp';

async function* calculateByteLengthInBaches(asyncIterator, options) {
  let byteLength = 0;

  for await (const chunk of asyncIterator) {
    byteLength += chunk.byteLength || 0;
    yield chunk;
  }
  options?.onEnd({byteLength});
}

test('byteLengthTransform', async (t) => {
  const inputChunks = [
    new Uint8Array([1, 2, 3]).buffer,
    new Uint8Array([4, 5, 6]).buffer,
    new Uint8Array([7, 8, 9]).buffer
  ];

  let byteLength;
  let callCount = 0;

  // @ts-ignore
  const transformIterator = calculateByteLengthInBaches(inputChunks, {
    onEnd: (result) => {
      byteLength = result.byteLength;
      callCount++;
    }
  });

  const transformedChunks: ArrayBuffer[] = [];
  for await (const chunk of transformIterator) {
    transformedChunks.push(chunk);
  }

  t.equal(byteLength, 9, 'ByteLengthTransform generated correct byteLength');
  t.equal(callCount, 1, 'ByteLengthTransform called onEnd exactly once');

  const inputData = concatenateArrayBuffers(...inputChunks);
  const transformedData = concatenateArrayBuffers(...transformedChunks);

  t.ok(compareArrayBuffers(inputData, transformedData), 'ByteLengthTransform passed through data');

  t.end();
});

function compareArrayBuffers(a, b) {
  a = new Uint8Array(a);
  b = new Uint8Array(b);
  if (a.byteLength !== b.byteLength) {
    return false;
  }
  for (let i = 0, l = a.byteLength; i < l; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

// Tests that iterator input and non-streaming loader does not crash
test('byteLengthTransform#non-streaming', async (t) => {
  // Run a streaming digest on all test cases.
  let hash;

  // @ts-ignore
  const crc32 = new CRC32CHash({
    crypto: {
      onEnd: (result) => {
        hash = result.hash;
      }
    }
  });

  const response = await fetchFile(SHAPEFILE_URL);
  let iterator = makeIterator(response);
  iterator = crc32.hashBatches(iterator);

  const batchIterator = await parseInBatches(iterator, ShapefileLoader);
  for await (const batch of batchIterator) {
    t.ok(batch, 'streaming hash is correct');
  }

  t.equal(hash, 'sC9tGA==', `Shapefile hash should correct: "${hash}"`);
  t.end();
});
