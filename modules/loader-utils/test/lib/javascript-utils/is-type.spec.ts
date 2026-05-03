import {expect, test} from 'vitest';
import {
  isObject,
  isPureObject,
  isArrayBuffer,
  isArrayBufferLike,
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
test('is-type#object checks', () => {
  class TestClass {}
  expect(isObject({}), 'object is object').toBeTruthy();
  expect(isPureObject({}), 'object if pure').toBe(true);
  expect(isPureObject([]), 'array is not pure').toBe(false);
  expect(isPureObject(3), 'number is not pure').toBe(false);
  expect(isPureObject(new TestClass()), 'class instance is not pure').toBe(false);
  expect(isObject(null), 'null is not object').toBeFalsy();
  expect(isPureObject({foo: 'bar'}), 'plain object is pure').toBeTruthy();
  expect(isPureObject(new (class Test {})()), 'class instance is not pure').toBeFalsy();
});
test('is-type#array buffer checks', () => {
  const arrayBuffer = new ArrayBuffer(8);
  const uint8Array = new Uint8Array(arrayBuffer);
  expect(isArrayBuffer(arrayBuffer), 'ArrayBuffer is ArrayBuffer').toBeTruthy();
  expect(isArrayBuffer(uint8Array), 'TypedArray is not ArrayBuffer').toBeFalsy();
  expect(isArrayBufferLike(arrayBuffer), 'ArrayBuffer is ArrayBufferLike').toBeTruthy();
  expect(isArrayBufferLike(uint8Array), 'TypedArray is ArrayBufferLike').toBeTruthy();
  expect(
    isArrayBufferLike({byteLength: 8}),
    'Object with byteLength is not ArrayBufferLike'
  ).toBeFalsy();
  if (typeof SharedArrayBuffer !== 'undefined') {
    const sharedArrayBuffer = new SharedArrayBuffer(8);
    expect(
      isArrayBufferLike(sharedArrayBuffer),
      'SharedArrayBuffer is ArrayBufferLike'
    ).toBeTruthy();
  } else {
    expect(true, 'SharedArrayBuffer not available in environment').toBe(true);
  }
});
test('is-type#promise checks', () => {
  const promise = Promise.resolve('value');
  expect(isPromise(promise), 'promise is promise').toBeTruthy();
  expect(isPromise({then: 'not a function'}), 'non-function then is not promise').toBeFalsy();
});
test.skip('isIterator', () => {
  const TESTS = [
    {
      input: new Set().entries(),
      output: true
    },
    {
      input: [].entries(),
      output: true
    },
    {
      input: (function* generator() {
        yield 1;
      })(),
      output: true
    },
    {
      input: [],
      output: false
    },
    {
      input: null,
      output: null
    }
  ];
  for (const testCase of TESTS) {
    expect(
      isIterator(testCase.input),
      `${testCase.output ? 'shoud' : 'should not'} be iterator`
    ).toBe(testCase.output);
  }
});
test('is-type#iterable checks', () => {
  const array = [1, 2, 3];
  const asyncIterable = {
    async *[Symbol.asyncIterator]() {
      yield 1;
    }
  };
  expect(isIterable(array), 'array is iterable').toBeTruthy();
  expect(isIterator(array.entries()), 'entries iterator is iterator').toBeTruthy();
  expect(isAsyncIterable(asyncIterable), 'custom async iterable is async iterable').toBeTruthy();
  expect(isIterator(array), 'array is not iterator').toBeFalsy();
});
test('is-type#response checks', () => {
  const mockResponse = {
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    text: () => Promise.resolve(''),
    json: () => Promise.resolve({})
  };
  expect(isResponse(mockResponse), 'duck-typed response is response').toBeTruthy();
  expect(isResponse({}), 'plain object is not response').toBeFalsy();
});
test('is-type#file/blob checks', () => {
  if (typeof File !== 'undefined') {
    const file = new File(['abc'], 'test.txt');
    expect(isFile(file), 'File instance is file').toBeTruthy();
  } else {
    expect(true, 'File not available in environment').toBe(true);
  }
  if (typeof Blob !== 'undefined') {
    const blob = new Blob(['abc']);
    expect(isBlob(blob), 'Blob instance is blob').toBeTruthy();
  } else {
    expect(true, 'Blob not available in environment').toBe(true);
  }
});
test('is-type#buffer check', () => {
  const mockBuffer = {isBuffer: true, buffer: new ArrayBuffer(8)};
  expect(isBuffer(mockBuffer), 'mock buffer passes buffer guard').toBeTruthy();
  expect(isBuffer({buffer: new ArrayBuffer(8)}), 'missing isBuffer flag fails').toBeFalsy();
});
test('is-type#readable streams', async () => {
  if (globalThis.process?.versions?.node) {
    const {Readable, PassThrough} = await import('stream');
    const nodeReadable = Readable.from(['hello']);
    const passThrough = new PassThrough();
    passThrough.write('hi');
    passThrough.end();
    expect(isReadableNodeStream(nodeReadable), 'Node readable stream detected').toBeTruthy();
    expect(isReadableNodeStream(passThrough), 'PassThrough is readable').toBeTruthy();
    expect(isReadableStream(nodeReadable), 'Node readable satisfies readable stream').toBeTruthy();
  } else {
    expect(true, 'Node streams not available in environment').toBe(true);
  }
  if (typeof ReadableStream !== 'undefined') {
    const readableStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data'));
        controller.close();
      }
    });
    expect(isReadableDOMStream(readableStream), 'DOM ReadableStream detected').toBeTruthy();
    expect(
      isReadableStream(readableStream),
      'DOM ReadableStream satisfies readable stream'
    ).toBeTruthy();
  } else {
    expect(true, 'ReadableStream not available in environment').toBe(true);
  }
});
test('is-type#writable streams', () => {
  const writableMock = {
    end: () => {},
    write: () => {},
    writable: true
  };
  expect(isWritableNodeStream(writableMock), 'mock node writable detected').toBeTruthy();
  expect(isWritableStream(writableMock), 'mock writable satisfies writable stream').toBeTruthy();
  if (typeof WritableStream !== 'undefined') {
    const writableStream = new WritableStream({
      write() {},
      close() {}
    });
    expect(isWritableDOMStream(writableStream), 'DOM WritableStream detected').toBeTruthy();
    expect(
      isWritableStream(writableStream),
      'DOM WritableStream satisfies writable stream'
    ).toBeTruthy();
  } else {
    expect(true, 'WritableStream not available in environment').toBe(true);
  }
});
