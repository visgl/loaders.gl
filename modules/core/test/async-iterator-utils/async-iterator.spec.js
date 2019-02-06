// https://jakearchibald.com/2017/async-iterators-and-generators/
import test from 'tape-promise/tape';

/* global setTimeout */
const setTimeoutPromise = timeout => new Promise(resolve => setTimeout(resolve, timeout));

test('async-iterator', async t => {

  // Note the * after "function"
  async function* asyncRandomNumbers() {
    let number = 0;
    for (;;) {
      await setTimeoutPromise(10);
      number += 1;
      yield number;
    }
  }

  for await (const number of asyncRandomNumbers()) {
    t.comment(`async iterating over ${number}`);
    if (number > 3) {
      t.end();
      return;
    }
  }

});
