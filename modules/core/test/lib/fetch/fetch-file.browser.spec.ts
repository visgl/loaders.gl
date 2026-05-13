import {expect, test} from 'vitest';
import {fetchFile} from '@loaders.gl/core';

const TEXT_DATA = 'important content!';
const JSON_DATA = [{col1: 22, col2: 'abc'}];
const BINARY_URL = '@loaders.gl/core/test/data/files/binary-data.bin';

test('fetchFile(Blob)#Response.text() BROWSER ONLY', async () => {
  const blob = new Blob([TEXT_DATA]);
  const response = await fetchFile(blob);

  expect(response, 'fetchFile(Blob) returned response').toBeTruthy();
  expect(response.bodyUsed, 'response.bodyUsed is false').toBe(false);

  const headers = response.headers;
  expect(headers, 'response has headers').toBeTruthy();
  expect(headers.get('content-length'), 'response headers has content-length').toBe(
    String(TEXT_DATA.length)
  );

  const text = await response.text();
  expect(text, 'response.text() returned correct string').toBe(TEXT_DATA);
  expect(response.bodyUsed, 'response.bodyUsed is true').toBe(true);
});

test('fetchFile(Blob)#Response.json() BROWSER ONLY', async () => {
  const text = JSON.stringify(JSON_DATA);
  const blob = new Blob([text], {type: 'application/json'});
  const response = await fetchFile(blob);

  expect(response, 'fetchFile(Blob) returned response').toBeTruthy();
  expect(response.bodyUsed, 'response.bodyUsed is false').toBe(false);

  const headers = response.headers;
  expect(headers, 'response has headers').toBeTruthy();
  expect(headers.get('content-length'), 'response headers has content-length').toBe(
    String(text.length)
  );
  expect(headers.get('content-type'), 'response headers has content-type').toBe('application/json');

  const json = await response.json();
  expect(json, 'response.json() returned correct data').toEqual(JSON_DATA);
  expect(response.bodyUsed, 'response.bodyUsed is true').toBe(true);
});

test('fetchFile(Blob)#Response.arrayBuffer() BROWSER ONLY', async () => {
  const response1 = await fetchFile(BINARY_URL);
  const data = await response1.arrayBuffer();
  expect(
    data instanceof ArrayBuffer,
    'fetchFile(Blob) loaded local file into ArrayBuffer'
  ).toBeTruthy();
  expect(data.byteLength, 'fetchFile(Blob) loaded local file length correctly').toBe(4);

  const blob = new Blob([data], {type: 'application/octet-stream'});
  const response = await fetchFile(blob);
  expect(response, 'fetchFile(Blob) returned response').toBeTruthy();
  expect(response.bodyUsed, 'response.bodyUsed is false').toBe(false);

  const headers = response.headers;
  expect(headers, 'response has headers').toBeTruthy();
  expect(headers.get('content-length'), 'response headers has content-length').toBe(
    String(data.byteLength)
  );
  expect(headers.get('content-type'), 'response headers has content-type').toBe(
    'application/octet-stream'
  );

  const arrayBuffer = await response.arrayBuffer();
  expect(arrayBuffer, 'returned response').toEqual(data);
  expect(response.bodyUsed, 'response.bodyUsed is true').toBe(true);
});

test('fetchFile(Blob)#Response.body BROWSER ONLY', async () => {
  const response1 = await fetchFile(BINARY_URL);
  const data = await response1.arrayBuffer();
  expect(
    data instanceof ArrayBuffer,
    'fetchFile(Blob) loaded local file into ArrayBuffer'
  ).toBeTruthy();
  expect(data.byteLength, 'fetchFile(Blob) loaded local file length correctly').toBe(4);

  const blob = new Blob([data], {type: 'application/octet-stream'});
  const response = await fetchFile(blob);
  expect(response, 'fetchFile(Blob) returned response').toBeTruthy();
  expect(response.bodyUsed, 'response.bodyUsed is false').toBe(false);

  const headers = response.headers;
  expect(headers, 'response has headers').toBeTruthy();
  expect(headers.get('content-length'), 'response headers has content-length').toBe(
    String(data.byteLength)
  );
  expect(headers.get('content-type'), 'response headers has content-type').toBe(
    'application/octet-stream'
  );

  const stream = response.body;
  expect(stream, 'returned stream').toBeTruthy();
});
