import test from 'tape-promise/tape';
import '@loaders.gl/polyfills';

function returnReject() {
  return Promise.reject('Wrong request');
}

function returnFulfilled() {
  return Promise.resolve('success');
}

test('polyfills#Promise.allSettled()', async t => {
  const promises = [returnFulfilled(), returnReject()];
  const result = await Promise.allSettled(promises);

  t.ok(result);
  t.ok(result.some(res => res.status === 'fulfilled' && res.value === 'success'));
  t.ok(result.some(res => res.status === 'rejected' && res.reason === 'Wrong request'));
  t.end();
});
