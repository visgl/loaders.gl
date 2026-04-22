import {expect, test} from 'vitest';
// https://fetch.spec.whatwg.org/#headers-class
// Run the tests both under browser and Node (ensures they conform to built-in)
test('constructor copies headers', () => {
  const original = new Headers();
  original.append('Accept', 'application/json');
  original.append('Accept', 'text/plain');
  original.append('Content-Type', 'text/html');
  const headers = new Headers(original);
  expect(headers.get('Accept')).toBe('application/json, text/plain');
  expect(headers.get('Content-type')).toBe('text/html');
});
test('constructor works with arrays', () => {
  const array: [string, string][] = [
    ['Content-Type', 'text/xml'],
    ['Breaking-Bad', '<3']
  ];
  const headers = new Headers(array);
  expect(headers.get('Content-Type')).toBe('text/xml');
  expect(headers.get('Breaking-Bad')).toBe('<3');
});
test('headers are case insensitive', () => {
  const headers = new Headers({Accept: 'application/json'});
  expect(headers.get('ACCEPT')).toBe('application/json');
  expect(headers.get('Accept')).toBe('application/json');
  expect(headers.get('accept')).toBe('application/json');
});
test('appends to existing', () => {
  const headers = new Headers({Accept: 'application/json'});
  expect(headers.has('Content-Type')).toBeFalsy();
  headers.append('Content-Type', 'application/json');
  expect(headers.has('Content-Type')).toBeTruthy();
  expect(headers.get('Content-Type')).toBe('application/json');
});
test('appends values to existing header name', () => {
  const headers = new Headers({Accept: 'application/json'});
  headers.append('Accept', 'text/plain');
  expect(headers.get('Accept')).toBe('application/json, text/plain');
});
test('sets header name and value', () => {
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  expect(headers.get('Content-Type')).toBe('application/json');
});
test('returns null on no header found', () => {
  const headers = new Headers();
  expect(headers.get('Content-Type')).toBe(null);
});
test('has headers that are set', () => {
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  expect(headers.has('Content-Type')).toBeTruthy();
});
test('deletes headers', () => {
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  expect(headers.has('Content-Type')).toBeTruthy();
  headers.delete('Content-Type');
  expect(headers.has('Content-Type')).toBeFalsy();
  expect(headers.get('Content-Type')).toBe(null);
});
test('converts field name to string on set and get', () => {
  const headers = new Headers();
  // @ts-ignore
  headers.set(1, 'application/json');
  expect(headers.has('1')).toBeTruthy();
  // @ts-ignore
  expect(headers.get(1)).toBe('application/json');
});
test('converts field value to string on set and get', () => {
  const headers = new Headers();
  // @ts-ignore
  headers.set('Content-Type', 1);
  // @ts-ignore
  headers.set('X-CSRF-Token', undefined);
  expect(headers.get('Content-Type')).toBe('1');
  expect(headers.get('X-CSRF-Token')).toBe('undefined');
});
test('throws TypeError on invalid character in field name', () => {
  // @ts-ignore
  // t.throws(() => new Headers({'[Accept]': 'application/json'}), TypeError);
  // @ts-ignore
  // t.throws(() => new Headers({'Accept:': 'application/json'}), TypeError);
  // @ts-ignore
  expect(() => new Headers().set({field: 'value'}, 'application/json')).toThrow(TypeError);
  // @ts-ignore
  expect(() => new Headers({'': 'application/json'})).toThrow(TypeError);
});
test('is iterable with forEach', () => {
  // featureDependent(!brokenFF)
  // featureDependent(test, !brokenFF);
  const headers = new Headers();
  headers.append('Accept', 'application/json');
  headers.append('Accept', 'text/plain');
  headers.append('Content-Type', 'text/html');
  const results: {
    value: string;
    key: string;
    object: Headers;
  }[] = [];
  headers.forEach((value, key, object) => results.push({value, key, object}));
  expect(results.length).toBe(2);
  expect({key: 'accept', value: 'application/json, text/plain', object: headers}).toEqual(
    results[0]
  );
  expect({key: 'content-type', value: 'text/html', object: headers}).toEqual(results[1]);
});
test('forEach accepts second thisArg argument', () => {
  const headers = new Headers({Accept: 'application/json'});
  const thisArg = 42;
  // eslint-disable-next-line no-invalid-this
  headers.forEach(function () {
    // @ts-ignore
    expect(this).toBe(thisArg);
  }, thisArg);
});
test('is iterable with keys', () => {
  // featureDependent(!brokenFF)
  const headers = new Headers();
  headers.append('Accept', 'application/json');
  headers.append('Accept', 'text/plain');
  headers.append('Content-Type', 'text/html');
  const iterator = headers.keys();
  expect({done: false, value: 'accept'}).toEqual(iterator.next());
  expect({done: false, value: 'content-type'}).toEqual(iterator.next());
  expect({done: true, value: undefined}).toEqual(iterator.next());
});
test('is iterable with values', () => {
  // featureDependent(!brokenFF)
  const headers = new Headers();
  headers.append('Accept', 'application/json');
  headers.append('Accept', 'text/plain');
  headers.append('Content-Type', 'text/html');
  const iterator = headers.values();
  expect({done: false, value: 'application/json, text/plain'}).toEqual(iterator.next());
  expect({done: false, value: 'text/html'}).toEqual(iterator.next());
  expect({done: true, value: undefined}).toEqual(iterator.next());
});
test('is iterable with entries', () => {
  // featureDependent(!brokenFF)
  const headers = new Headers();
  headers.append('Accept', 'application/json');
  headers.append('Accept', 'text/plain');
  headers.append('Content-Type', 'text/html');
  const iterator = headers.entries();
  expect({done: false, value: ['accept', 'application/json, text/plain']}).toEqual(iterator.next());
  expect({done: false, value: ['content-type', 'text/html']}).toEqual(iterator.next());
  expect({done: true, value: undefined}).toEqual(iterator.next());
});
