"use strict";var test;module.link('tape-promise/tape',{default(v){test=v}},0);// https://jakearchibald.com/2017/async-iterators-and-generators/


/* global setTimeout */
const setTimeoutPromise = timeout => new Promise(resolve => setTimeout(resolve, timeout));

async function* asyncNumbers() {
  let number = 0;
  for (;;) {
    await setTimeoutPromise(10);
    number += 1;
    yield number;
  }
}

test('async-iterator', async t => {
  for await (const number of asyncNumbers()) {
    t.comment(`async iterating over ${number}`);
    if (number > 3) {
      t.end();
      return;
    }
  }
});
