import {expect, test} from 'vitest';
import {
  forEach,
  makeTextDecoderIterator,
  makeTextEncoderIterator,
  makeLineIterator,
  makeNumberedLineIterator,
  concatenateArrayBuffersAsync
} from '@loaders.gl/loader-utils';
import {
  advanceTimersAndFlush,
  createDeferred,
  withFakeTimers
} from '@loaders.gl/test-utils/vitest';
import {NDJSONLoader} from '@loaders.gl/json';
const parseNDJSONInBatches = NDJSONLoader.parseInBatches;

function waitForTimer(timeout: number): Promise<void> {
  const deferred = createDeferred<void>();
  setTimeout(() => deferred.resolve(), timeout);
  return deferred.promise;
}

async function* asyncNumbers() {
  let number = 0;
  for (let i = 0; i < 3; i++) {
    await waitForTimer(10);
    number += 1;
    yield number;
  }
}
async function* asyncTexts() {
  await waitForTimer(10);
  yield 'line 1\nline';
  await waitForTimer(10);
  yield ' 2\nline 3\n';
  await waitForTimer(10);
  yield 'line 4';
}
function asyncArrayBuffers() {
  return makeTextEncoderIterator(asyncTexts());
}
async function* asyncJsons() {
  await waitForTimer(10);
  yield '{"id":0,"field":"value0","flag":false}\n{"id":1,"fie';
  await waitForTimer(10);
  yield 'ld":"value1","flag":true}\n{"id":2,"field":"value2","flag":false}\n';
  await waitForTimer(10);
  yield '{"id":3,"field":"value3","flag":true}';
}
function asyncNDJson() {
  return makeTextEncoderIterator(asyncJsons());
}
test('async-iterator#forEach', async () => {
  await withFakeTimers(async () => {
    let iterations = 0;
    const iterationPromise = forEach(asyncNumbers(), number => {
      iterations++;
      expect(number, `async iterating over ${number}`).toBe(iterations);
    });

    await advanceTimersAndFlush(30);
    await iterationPromise;
  });
});
test('async-iterator#makeTextDecoderIterator', async () => {
  await withFakeTimers(async () => {
    const textsPromise = (async () => {
      for await (const text of asyncTexts()) {
        expect(typeof text === 'string', 'async iterator yields string').toBeTruthy();
      }
    })();

    const decodedTextsPromise = (async () => {
      for await (const text of makeTextDecoderIterator(asyncArrayBuffers())) {
        expect(typeof text === 'string', 'async iterator yields string').toBeTruthy();
      }
    })();

    await advanceTimersAndFlush(60);
    await textsPromise;
    await decodedTextsPromise;
  });
});
test('async-iterator#makeLineIterator', async () => {
  await withFakeTimers(async () => {
    let iterations = 0;
    const iterationPromise = (async () => {
      for await (const text of makeLineIterator(asyncTexts())) {
        iterations++;
        expect(text.trim(), 'yields single line').toBe(`line ${iterations}`);
      }
    })();

    await advanceTimersAndFlush(30);
    await iterationPromise;
  });
});
test('async-iterator#makeNumberedLineIterator', async () => {
  await withFakeTimers(async () => {
    let iterations = 0;
    const iterationPromise = (async () => {
      for await (const result of makeNumberedLineIterator(makeLineIterator(asyncTexts()))) {
        iterations++;
        expect(result.line.trim(), 'line text').toBe(`line ${iterations}`);
        expect(result.counter, 'line counter').toBe(iterations);
      }
    })();

    await advanceTimersAndFlush(30);
    await iterationPromise;
  });
});
test('async-iterator#parseNDJSONInBatches', async () => {
  await withFakeTimers(async () => {
    let id = 0;
    const iterationPromise = (async () => {
      for await (const batch of parseNDJSONInBatches(asyncNDJson())) {
        // @ts-expect-error
        const obj = batch.data[0];
        expect(typeof obj, 'async iterator yields object').toBe('object');
        /* eslint-disable */
        expect(obj['id'], 'id property matches').toBe(id);
        expect(obj['field'], 'field property matches').toBe(`value${id}`);
        expect(obj['flag'], 'flag field matches').toBe(Boolean(id % 2));
        id++;
      }
    })();

    await advanceTimersAndFlush(30);
    await iterationPromise;
  });
});
test('async-iterator#concatenateArrayBuffersAsync accepts ArrayBufferLike and views', async () => {
  const sharedArrayBuffer =
    typeof SharedArrayBuffer !== 'undefined' ? new SharedArrayBuffer(4) : new ArrayBuffer(4);
  const sharedView = new Uint8Array(sharedArrayBuffer);
  sharedView.set([1, 2, 3, 4]);
  const view = new Uint8Array([5, 6]);
  const result = await concatenateArrayBuffersAsync([
    sharedArrayBuffer,
    view.subarray(1),
    new DataView(new Uint8Array([7, 8]).buffer)
  ]);
  expect(new Uint8Array(result)).toEqual(new Uint8Array([1, 2, 3, 4, 6, 7, 8]));
});
test('async-iterator#concatenateArrayBuffersAsync copies numeric views', async () => {
  const floatView = new Float32Array([1.25, 2.5]);
  const int16View = new Int16Array([0x1122, 0x3344]);
  const result = await concatenateArrayBuffersAsync([floatView, int16View]);
  const reconstructed = new Uint8Array(result);
  const expected = new Uint8Array(new Uint8Array(floatView.buffer).length + int16View.byteLength);
  expected.set(new Uint8Array(floatView.buffer));
  expected.set(new Uint8Array(int16View.buffer), floatView.byteLength);
  expect(reconstructed, 'copies view bytes instead of truncating values').toEqual(expected);
});
