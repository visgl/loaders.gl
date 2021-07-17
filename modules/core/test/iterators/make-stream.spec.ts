/* eslint-disable no-invalid-this, import/no-extraneous-dependencies */
import test from 'tape-promise/tape';
import {isBrowser, makeStream, makeIterator} from '@loaders.gl/core';
import {concatenateArrayBuffers, concatenateArrayBuffersAsync} from '@loaders.gl/loader-utils';

test('asyncIteratorToStream#fetch from asyncIteratorStream', async (t) => {
  // TODO - fix for Node.js
  if (isBrowser) {
    const data = [1, 2, 3].map((value) => new Uint8Array([value]).buffer);
    const concatenatedData = concatenateArrayBuffers(...data);

    const stream = makeStream(data);
    // @ts-expect-error stream can be either Node or DOM stream
    const response = new Response(stream);
    const arrayBuffer = await response.arrayBuffer();

    t.equals(arrayBuffer.byteLength, 3);
    t.deepEquals(arrayBuffer, concatenatedData);
  }
  t.end();
});

test('asyncIteratorToStream#makeIterator(iteratorToStream())', async (t) => {
  const data = [1, 2, 3].map((value) => new Uint8Array([value]).buffer);
  const concatenatedData = concatenateArrayBuffers(...data);

  const stream = makeStream(data);
  // @ts-expect-error stream can be either Node or DOM stream
  const streamIterator = makeIterator(stream);

  const chunks = await concatenateArrayBuffersAsync(streamIterator);
  t.equals(chunks.byteLength, 3);
  t.deepEquals(chunks, concatenatedData);
  t.end();
});

test('asyncIteratorToStream#read stream using DOM/Node APIs', async (t) => {
  const data = [1, 2, 3].map((value) => new Uint8Array([value]).buffer);
  const concatenatedData = concatenateArrayBuffers(...data);

  const stream = makeStream(data);
  const arrayBuffer = await readStream(stream);

  t.equals(arrayBuffer.byteLength, 3);
  t.deepEquals(arrayBuffer, concatenatedData);
  t.end();
});

// HELPERS

/** Read chunks from a DOM style stream */
async function readStream(stream): Promise<ArrayBuffer> {
  return isBrowser ? readDOMStream(stream) : readNodeStream(stream);
}

/** Read chunks from a node style stream */
async function readNodeStream(stream): Promise<ArrayBuffer> {
  return await new Promise<ArrayBuffer>((resolve) => {
    const chunks: ArrayBuffer[] = [];
    stream.on('data', (chunk) => {
      chunks.push(chunk.buffer);
    });
    stream.on('end', () => {
      resolve(concatenateArrayBuffers(...chunks));
    });
  });
}

async function readDOMStream(stream: ReadableStream): Promise<ArrayBuffer> {
  // TODO - use reader
  const response = new Response(stream);
  return await response.arrayBuffer();
}
