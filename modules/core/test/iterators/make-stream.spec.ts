import {expect, test} from 'vitest';
import {isBrowser, makeStream, makeIterator} from '@loaders.gl/core';
import {concatenateArrayBuffers, concatenateArrayBuffersAsync} from '@loaders.gl/loader-utils';

test.runIf(isBrowser)('asyncIteratorToStream#fetch from asyncIteratorStream', async () => {
  // TODO - fix for Node.js
  const data = [1, 2, 3].map(value => new Uint8Array([value]).buffer);
  const concatenatedData = concatenateArrayBuffers(...data);

  const stream = makeStream(data);
  const response = new Response(stream);
  const arrayBuffer = await response.arrayBuffer();

  expect(arrayBuffer.byteLength).toBe(3);
  expect(arrayBuffer).toEqual(concatenatedData);
});

test('asyncIteratorToStream#makeIterator(iteratorToStream())', async () => {
  const data = [1, 2, 3].map(value => new Uint8Array([value]).buffer);
  const concatenatedData = concatenateArrayBuffers(...data);

  const stream = makeStream(data);
  const streamIterator = makeIterator(stream);
  const chunks = await concatenateArrayBuffersAsync(streamIterator);

  expect(chunks.byteLength).toBe(3);
  expect(chunks).toEqual(concatenatedData);
});

test('makeIterator#rethrows stream read errors and releases the lock', async () => {
  const readError = new Error('Stream read failed');
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.error(readError);
    }
  });

  let thrownError: unknown;
  try {
    for await (const _chunk of makeIterator(stream) as AsyncIterable<ArrayBuffer>) {
      // The stream errors before yielding a chunk
    }
  } catch (error) {
    thrownError = error;
  }

  expect(thrownError).toBe(readError);
  expect(stream.locked).toBe(false);
});

test('makeIterator#cancels stream and releases the lock on early return', async () => {
  let cancellationCount = 0;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array([1]));
    },
    cancel() {
      cancellationCount++;
    }
  });

  for await (const _chunk of makeIterator(stream, {
    _streamReadAhead: true
  }) as AsyncIterable<ArrayBuffer>) {
    break;
  }

  expect(cancellationCount).toBe(1);
  expect(stream.locked).toBe(false);
});

test('makeIterator#releases stream lock after natural completion', async () => {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array([1]));
      controller.close();
    }
  });

  await concatenateArrayBuffersAsync(makeIterator(stream) as AsyncIterable<ArrayBuffer>);

  expect(stream.locked).toBe(false);
});

test('asyncIteratorToStream#read stream using DOM/Node APIs', async () => {
  const data = [1, 2, 3].map(value => new Uint8Array([value]).buffer);
  const concatenatedData = concatenateArrayBuffers(...data);

  const stream = makeStream(data);
  const arrayBuffer = await readStream(stream);

  expect(arrayBuffer.byteLength).toBe(3);
  expect(arrayBuffer).toEqual(concatenatedData);
});

/** Read chunks from a DOM style stream. */
async function readStream(stream): Promise<ArrayBuffer> {
  return isBrowser ? readDOMStream(stream) : readNodeStream(stream);
}

/** Read chunks from a node style stream. */
async function readNodeStream(stream): Promise<ArrayBuffer> {
  return await new Promise<ArrayBuffer>(resolve => {
    const chunks: ArrayBuffer[] = [];
    stream.on('data', chunk => {
      chunks.push(chunk.buffer);
    });
    stream.on('end', () => {
      resolve(concatenateArrayBuffers(...chunks));
    });
  });
}

/** Read chunks from a DOM style stream. */
async function readDOMStream(stream: ReadableStream): Promise<ArrayBuffer> {
  // TODO - use reader
  const response = new Response(stream);
  return await response.arrayBuffer();
}
