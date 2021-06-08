import test from 'tape-promise/tape';
import {AsyncQueue} from '@loaders.gl/tables';

test('Enqueue before dequeue', async (t) => {
  const queue = new AsyncQueue();
  queue.enqueue('a');
  queue.enqueue('b');
  queue.close();
  t.deepEqual(await takeAsync(queue), ['a', 'b']);
  t.end();
});

test('Dequeue before enqueue', async (t) => {
  const queue = new AsyncQueue();
  const promise = Promise.all([queue.next(), queue.next()]);

  queue.enqueue('a');
  queue.enqueue('b');
  queue.close();

  const array = await promise;
  const values = array.map((x) => x.value);
  t.deepEqual(values, ['a', 'b']);
  t.end();
});

/**
 * @returns a Promise for an Array with the elements
 * in `asyncIterable`
 */
async function takeAsync(asyncIterable, count = Infinity) {
  const result = [];
  const iterator = asyncIterable[Symbol.asyncIterator]();
  while (result.length < count) {
    const {value, done} = await iterator.next();
    if (done) {
      break;
    }
    result.push(value);
  }
  return result;
}
