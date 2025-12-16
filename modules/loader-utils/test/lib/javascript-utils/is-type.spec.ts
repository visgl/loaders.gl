// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {Readable, PassThrough} from 'stream';

import {
  isObject,
  isPureObject,
  isPromise,
  isIterable,
  isAsyncIterable,
  isIterator,
  isResponse,
  isFile,
  isBlob,
  isBuffer,
  isReadableDOMStream,
  isReadableNodeStream,
  isReadableStream,
  isWritableDOMStream,
  isWritableNodeStream,
  isWritableStream
} from '@loaders.gl/loader-utils';

test('is-type#object checks', (t) => {
  t.ok(isObject({}), 'object is object');
  t.notOk(isObject(null), 'null is not object');
  t.ok(isPureObject({foo: 'bar'}), 'plain object is pure');
  t.notOk(isPureObject(new (class Test {})()), 'class instance is not pure');
  t.end();
});

test('is-type#promise checks', (t) => {
  const promise = Promise.resolve('value');
  t.ok(isPromise(promise), 'promise is promise');
  t.notOk(isPromise({then: 'not a function'}), 'non-function then is not promise');
  t.end();
});

test('is-type#iterable checks', (t) => {
  const array = [1, 2, 3];
  const asyncIterable = {
    async *[Symbol.asyncIterator]() {
      yield 1;
    }
  };
  t.ok(isIterable(array), 'array is iterable');
  t.ok(isIterator(array.entries()), 'entries iterator is iterator');
  t.ok(isAsyncIterable(asyncIterable), 'custom async iterable is async iterable');
  t.notOk(isIterator(array), 'array is not iterator');
  t.end();
});

test('is-type#response checks', (t) => {
  const mockResponse = {
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    text: () => Promise.resolve(''),
    json: () => Promise.resolve({})
  };
  t.ok(isResponse(mockResponse), 'duck-typed response is response');
  t.notOk(isResponse({}), 'plain object is not response');
  t.end();
});

test('is-type#file/blob checks', (t) => {
  if (typeof File !== 'undefined') {
    const file = new File(['abc'], 'test.txt');
    t.ok(isFile(file), 'File instance is file');
  } else {
    t.pass('File not available in environment');
  }

  if (typeof Blob !== 'undefined') {
    const blob = new Blob(['abc']);
    t.ok(isBlob(blob), 'Blob instance is blob');
  } else {
    t.pass('Blob not available in environment');
  }

  t.end();
});

test('is-type#buffer check', (t) => {
  const mockBuffer = {isBuffer: true, buffer: new ArrayBuffer(8)};
  t.ok(isBuffer(mockBuffer), 'mock buffer passes buffer guard');
  t.notOk(isBuffer({buffer: new ArrayBuffer(8)}), 'missing isBuffer flag fails');
  t.end();
});

test('is-type#readable streams', (t) => {
  const nodeReadable = Readable.from(['hello']);
  const passThrough = new PassThrough();
  passThrough.write('hi');
  passThrough.end();

  t.ok(isReadableNodeStream(nodeReadable), 'Node readable stream detected');
  t.ok(isReadableNodeStream(passThrough), 'PassThrough is readable');
  t.ok(isReadableStream(nodeReadable), 'Node readable satisfies readable stream');

  if (typeof ReadableStream !== 'undefined') {
    const readableStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data'));
        controller.close();
      }
    });
    t.ok(isReadableDOMStream(readableStream), 'DOM ReadableStream detected');
    t.ok(isReadableStream(readableStream), 'DOM ReadableStream satisfies readable stream');
  } else {
    t.pass('ReadableStream not available in environment');
  }

  t.end();
});

test('is-type#writable streams', (t) => {
  const writableMock = {
    end: () => {},
    write: () => {},
    writable: true
  };
  t.ok(isWritableNodeStream(writableMock), 'mock node writable detected');
  t.ok(isWritableStream(writableMock), 'mock writable satisfies writable stream');

  if (typeof WritableStream !== 'undefined') {
    const writableStream = new WritableStream({
      write() {},
      close() {}
    });
    t.ok(isWritableDOMStream(writableStream), 'DOM WritableStream detected');
    t.ok(isWritableStream(writableStream), 'DOM WritableStream satisfies writable stream');
  } else {
    t.pass('WritableStream not available in environment');
  }

  t.end();
});
