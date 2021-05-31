// Based on https://github.com/github/fetch under MIT license

import test from 'tape-promise/tape';
import '@loaders.gl/polyfills';
// import {isBrowser} from '@loaders.gl/core';

// https://fetch.spec.whatwg.org/#headers-class
// Run the tests both under browser and Node (ensures they conform to built-in)
test('constructor copies headers', t => {
  const original = new Headers();
  original.append('Accept', 'application/json');
  original.append('Accept', 'text/plain');
  original.append('Content-Type', 'text/html');

  const headers = new Headers(original);
  t.equal(headers.get('Accept'), 'application/json, text/plain');
  t.equal(headers.get('Content-type'), 'text/html');
  t.end();
});

test('constructor works with arrays', t => {
  const array = [
    ['Content-Type', 'text/xml'],
    ['Breaking-Bad', '<3']
  ];
  const headers = new Headers(array);

  t.equal(headers.get('Content-Type'), 'text/xml');
  t.equal(headers.get('Breaking-Bad'), '<3');
  t.end();
});

test('headers are case insensitive', t => {
  const headers = new Headers({Accept: 'application/json'});
  t.equal(headers.get('ACCEPT'), 'application/json');
  t.equal(headers.get('Accept'), 'application/json');
  t.equal(headers.get('accept'), 'application/json');
  t.end();
});

test('appends to existing', t => {
  const headers = new Headers({Accept: 'application/json'});
  t.notOk(headers.has('Content-Type'));
  headers.append('Content-Type', 'application/json');
  t.ok(headers.has('Content-Type'));
  t.equal(headers.get('Content-Type'), 'application/json');
  t.end();
});

test('appends values to existing header name', t => {
  const headers = new Headers({Accept: 'application/json'});
  headers.append('Accept', 'text/plain');
  t.equal(headers.get('Accept'), 'application/json, text/plain');
  t.end();
});

test('sets header name and value', t => {
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  t.equal(headers.get('Content-Type'), 'application/json');
  t.end();
});

test('returns null on no header found', t => {
  const headers = new Headers();
  t.equals(headers.get('Content-Type'), null);
  t.end();
});

test('has headers that are set', t => {
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  t.ok(headers.has('Content-Type'));
  t.end();
});

test('deletes headers', t => {
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  t.ok(headers.has('Content-Type'));
  headers.delete('Content-Type');
  t.notOk(headers.has('Content-Type'));
  t.equals(headers.get('Content-Type'), null);
  t.end();
});

test('converts field name to string on set and get', t => {
  const headers = new Headers();
  // @ts-ignore
  headers.set(1, 'application/json');
  t.ok(headers.has('1'));
  // @ts-ignore
  t.equal(headers.get(1), 'application/json');
  t.end();
});

test('converts field value to string on set and get', t => {
  const headers = new Headers();
  // @ts-ignore
  headers.set('Content-Type', 1);
  // @ts-ignore
  headers.set('X-CSRF-Token', undefined);
  t.equal(headers.get('Content-Type'), '1');
  t.equal(headers.get('X-CSRF-Token'), 'undefined');
  t.end();
});

test('throws TypeError on invalid character in field name', t => {
  // @ts-ignore
  t.throws(() => new Headers({'[Accept]': 'application/json'}), TypeError);
  // @ts-ignore
  t.throws(() => new Headers({'Accept:': 'application/json'}), TypeError);
  // @ts-ignore
  t.throws(() => new Headers().set({field: 'value'}, 'application/json'), TypeError);
  // @ts-ignore
  t.throws(() => new Headers({'': 'application/json'}), TypeError);
  t.end();
});

test('is iterable with forEach', t => {
  // featureDependent(!brokenFF)
  // featureDependent(test, !brokenFF);
  const headers = new Headers();
  headers.append('Accept', 'application/json');
  headers.append('Accept', 'text/plain');
  headers.append('Content-Type', 'text/html');

  const results = [];
  headers.forEach((value, key, object) => results.push({value, key, object}));

  t.equal(results.length, 2);
  t.deepEqual({key: 'accept', value: 'application/json, text/plain', object: headers}, results[0]);
  t.deepEqual({key: 'content-type', value: 'text/html', object: headers}, results[1]);
  t.end();
});

test('forEach accepts second thisArg argument', t => {
  const headers = new Headers({Accept: 'application/json'});
  const thisArg = 42;
  // eslint-disable-next-line no-invalid-this
  headers.forEach(function() {
    // @ts-ignore
    t.equal(this, thisArg);
  }, thisArg);
  t.end();
});

test('is iterable with keys', t => {
  // featureDependent(!brokenFF)
  const headers = new Headers();
  headers.append('Accept', 'application/json');
  headers.append('Accept', 'text/plain');
  headers.append('Content-Type', 'text/html');

  const iterator = headers.keys();
  t.deepEqual({done: false, value: 'accept'}, iterator.next());
  t.deepEqual({done: false, value: 'content-type'}, iterator.next());
  t.deepEqual({done: true, value: undefined}, iterator.next());
  t.end();
});

test('is iterable with values', t => {
  // featureDependent(!brokenFF)
  const headers = new Headers();
  headers.append('Accept', 'application/json');
  headers.append('Accept', 'text/plain');
  headers.append('Content-Type', 'text/html');

  const iterator = headers.values();
  t.deepEqual({done: false, value: 'application/json, text/plain'}, iterator.next());
  t.deepEqual({done: false, value: 'text/html'}, iterator.next());
  t.deepEqual({done: true, value: undefined}, iterator.next());
  t.end();
});

test('is iterable with entries', t => {
  // featureDependent(!brokenFF)
  const headers = new Headers();
  headers.append('Accept', 'application/json');
  headers.append('Accept', 'text/plain');
  headers.append('Content-Type', 'text/html');

  const iterator = headers.entries();
  t.deepEqual({done: false, value: ['accept', 'application/json, text/plain']}, iterator.next());
  t.deepEqual({done: false, value: ['content-type', 'text/html']}, iterator.next());
  t.deepEqual({done: true, value: undefined}, iterator.next());
  t.end();
});
