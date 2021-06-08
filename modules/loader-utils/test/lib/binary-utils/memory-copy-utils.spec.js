import test from 'tape-promise/tape';
import {padToNBytes, copyArrayBuffer, copyToArray} from '@loaders.gl/loader-utils';

test('padToNBytes', (t) => {
  t.ok(padToNBytes, 'padToNBytes defined');

  t.equal(padToNBytes(15, 16), 16);
  t.equal(padToNBytes(15, 8), 16);
  t.equal(padToNBytes(157, 3), 157);

  t.throws(() => padToNBytes(15, 0));
  t.throws(() => padToNBytes(15, -5));
  t.throws(() => padToNBytes(-10, 8));

  // The approach only works for even paddings
  t.notEqual(padToNBytes(32, 3), 33);

  t.end();
});

test('toBuffer', (t) => {
  t.ok(copyArrayBuffer, 'copyArrayBuffer defined');
  t.end();
});

test('copyToArray', (t) => {
  t.ok(copyToArray, 'copyToArray defined');
  t.end();
});
