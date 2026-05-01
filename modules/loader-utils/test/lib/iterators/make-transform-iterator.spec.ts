import {expect, test} from 'vitest';
import {concatenateArrayBuffers} from '@loaders.gl/loader-utils';
import {fetchFile, parseInBatches, makeIterator} from '@loaders.gl/core';
import {SHPLoader} from '@loaders.gl/shapefile';
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
test('byteLengthTransform', async () => {
  const inputChunks = [
    new Uint8Array([1, 2, 3]).buffer,
    new Uint8Array([4, 5, 6]).buffer,
    new Uint8Array([7, 8, 9]).buffer
  ];
  let byteLength;
  let callCount = 0;
  // @ts-ignore
  const transformIterator = calculateByteLengthInBaches(inputChunks, {
    onEnd: result => {
      byteLength = result.byteLength;
      callCount++;
    }
  });
  const transformedChunks: ArrayBuffer[] = [];
  for await (const chunk of transformIterator) {
    transformedChunks.push(chunk);
  }
  expect(byteLength, 'ByteLengthTransform generated correct byteLength').toBe(9);
  expect(callCount, 'ByteLengthTransform called onEnd exactly once').toBe(1);
  const inputData = concatenateArrayBuffers(...inputChunks);
  const transformedData = concatenateArrayBuffers(...transformedChunks);
  expect(
    compareArrayBuffers(inputData, transformedData),
    'ByteLengthTransform passed through data'
  ).toBeTruthy();
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
test('byteLengthTransform#non-streaming', async () => {
  // Run a streaming digest on all test cases.
  let hash;
  // @ts-ignore
  const crc32 = new CRC32CHash({
    crypto: {
      onEnd: result => {
        hash = result.hash;
      }
    }
  });
  const response = await fetchFile(SHAPEFILE_URL);
  let iterator = makeIterator(response);
  iterator = crc32.hashBatches(iterator, 'base64');
  const batchIterator = await parseInBatches(iterator, SHPLoader);
  for await (const batch of batchIterator) {
    expect(batch, 'streaming hash is correct').toBeTruthy();
  }
  expect(hash, `Shapefile hash should correct: "${hash}"`).toBe('sC9tGA==');
});
