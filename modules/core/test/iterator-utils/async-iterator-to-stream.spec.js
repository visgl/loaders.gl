/* eslint-disable no-invalid-this */
import test from 'tape-promise/tape';
import {asyncIteratorToStream} from '@loaders.gl/core/iterator-utils/async-iterator-to-stream';

const getChunks = stream =>
  new Promise(resolve => {
    const chunks = [];
    stream.on('data', chunk => {
      chunks.push(chunk);
    });
    stream.on('end', () => {
      resolve(chunks);
    });
  });

const makeIterator = (data, asynchronous = false) => {
  let i = 0;
  return {
    next() {
      const cursor = i < data.length ? {done: false, value: data[i++]} : {done: true};
      return asynchronous ? Promise.resolve(cursor) : cursor;
    }
  };
};

test('asyncIteratorToStream#works with sync iterators', async t => {
  const data = [1, 2, 3];
  const stream = asyncIteratorToStream.obj(makeIterator(data));
  t.deepEquals(await getChunks(stream), data);
  t.end();
});

test('asyncIteratorToStream#works with sync iterables', async t => {
  const data = [1, 2, 3];
  const stream = asyncIteratorToStream.obj({
    [Symbol['iterator']]: () => makeIterator(data)
  });
  t.deepEquals(await getChunks(stream), data);
  t.end();
});

test('asyncIteratorToStream#works with async iterators', async t => {
  const data = [1, 2, 3];
  const stream = asyncIteratorToStream.obj(makeIterator(data, true));
  t.deepEquals(await getChunks(stream), data);
  t.end();
});

test('asyncIteratorToStream#works with async iterables', async t => {
  const data = [1, 2, 3];
  const stream = asyncIteratorToStream.obj({
    [Symbol['asyncIterator']]: () => makeIterator(data, true)
  });
  t.deepEquals(await getChunks(stream), data);
  t.end();
});

/*
test('asyncIteratorToStream#with generators#sync', async t => {
  const expectedThis = {};
  const expectedArgs = ['foo', 'bar'];

  const stream = asyncIteratorToStream
    .obj(function*(...args) {
      // this is forwarded
      t.deepEquals(this).toBe(expectedThis);

      // args are forwarded
      t.deepEquals(args, expectedArgs);

      // can yield undefined to ask for the requested size
      t.deepEquals(typeof (yield undefined)).toBe('number');

      // can yield a value
      yield 1;

      // can yield a promise to wait for its resolution
      t.deepEquals(yield Promise.resolve('foo')).toBe('foo');
      try {
        yield Promise.reject(new Error('bar'));
        t.deepEquals(false).toBe(true);
      } catch (error) {
        t.deepEquals(error.message).toBe('bar');
      }

      yield 2;
    })
    .apply(expectedThis, expectedArgs);

  t.deepEquals(await getChunks(stream), [1, 2]);
  t.end();
});

test('asyncIteratorToStream#with generators##async', async t => {
  const expectedThis = {};
  const expectedArgs = ['foo', 'bar'];
  const stream = asyncIteratorToStream
    .obj(async function*(...args) {
      // this is forwarded
      t.deepEquals(this).toBe(expectedThis);

      // args are forwarded
      t.deepEquals(args, expectedArgs);

      // can yield undefined to ask for the requested size
      t.deepEquals(typeof (yield undefined)).toBe('number');

      // can yield a value
      yield 1;

      // promises are correctly handled
      t.deepEquals(await Promise.resolve('foo')).toBe('foo');
      try {
        yield Promise.reject(new Error('bar'));
        t.deepEquals(false).toBe(true);
      } catch (error) {
        t.deepEquals(error.message).toBe('bar');
      }

      yield 2;
    })
    .apply(expectedThis, expectedArgs);

  t.deepEquals(await getChunks(stream), [1, 2]);

  t.end();
});
*/
