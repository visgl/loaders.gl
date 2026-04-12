import {expect, test} from 'vitest';
import {isBrowser} from '@loaders.gl/core';
import {
  makeResponse,
  checkResponse,
  checkResponseSync
} from '@loaders.gl/core/lib/utils/response-utils';

test('Response', async () => {
  const response = new Response('abc');
  const text = await response.text();

  expect(text).toBe('abc');
});

test('makeResponse', async () => {
  const responseInput = new Response('abc');
  let response = await makeResponse(responseInput);
  expect(response, 'makeResponse() returns response argument').toBe(responseInput);

  response = await makeResponse('abc');
  expect(response.headers.get('content-length'), 'content-length was set by makeResponse').toBe(
    '3'
  );

  const text = await response.text();
  expect(text, 'could be read as text').toBe('abc');
  await expect(response.text(), 'refuses to read as text a second time').rejects.toBeDefined();
});

test('makeResponse(File)', async () => {
  const file = new File(['abc'], 'foo.txt', {
    type: 'text/plain'
  });
  const response = await makeResponse(file);

  expect(
    response.headers.get('content-length'),
    '"content-length" header was set by makeResponse'
  ).toBe('3');
  expect(
    response.headers.get('content-type'),
    '"content-type" header was set by makeResponse'
  ).toBe('text/plain');
  expect(response.url, 'response.url was set by Response constructor').toBe('foo.txt');
});

test.runIf(isBrowser)('makeResponse(File) browser headers', async () => {
  const file = new File(['abc'], 'foo.txt', {
    type: 'text/plain'
  });
  const response = await makeResponse(file);

  expect(
    response.headers.get('x-first-bytes'),
    '"x-first-bytes" header was set by makeResponse'
  ).toBe('data:application/octet-stream;base64,YWJj');

  const text = await response.text();
  expect(text, 'could be read as text').toBe('abc');
});

test('checkResponseSync', () => {
  const response = new Response('{message: "server died"}', {status: 500});

  expect(response.ok, 'Check response.ok').toBe(false);
  expect(() => checkResponseSync(response), 'Check response throws').toThrow(/500/);
});

test('checkResponse', async () => {
  const response = new Response('{message: "server died"}', {status: 500});
  Object.defineProperty(response, 'url', {
    value: 'https://some.url/not/even/very/long'
  });

  expect(response.ok, 'Check response.ok').toBe(false);
  await expect(checkResponse(response), 'Check response throws').rejects.toThrow(/500/);
});

test('checkResponse(body used)', async () => {
  const response = new Response('{message: "server died"}', {status: 500});
  await response.text();
  Object.defineProperty(response, 'url', {
    value: 'https://some.url/not/even/very/long'
  });

  expect(response.ok, 'Check response.ok').toBe(false);
  await expect(checkResponse(response), 'Check response throws').rejects.toThrow(/500/);
});
