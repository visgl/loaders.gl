import test from 'tape-promise/tape';

import {isBrowser, fetchFile} from '@loaders.gl/core';

const TEXT_DATA = 'important content!';
const JSON_DATA = [{col1: 22, col2: 'abc'}];
const BINARY_URL = '@loaders.gl/core/test/data/files/binary-data.bin';

test('fetchFile(Blob)#Response.text() BROWSER ONLY', async (t) => {
  if (isBrowser) {
    const blob = new Blob([TEXT_DATA]);

    const response = await fetchFile(blob);
    t.ok(response, 'fetchFile(Blob) returned response');
    t.equals(response.bodyUsed, false, 'response.bodyUsed is false');

    const headers = response.headers;
    t.ok(headers, 'response has headers');
    t.equals(
      headers.get('content-length'),
      String(TEXT_DATA.length),
      'response headers has content-length'
    );

    const text = await response.text();
    t.equals(text, TEXT_DATA, 'response.text() returned correct string');
    t.equals(response.bodyUsed, true, 'response.bodyUsed is true');
  }
  t.end();
});

test('fetchFile(Blob)#Response.json() BROWSER ONLY', async (t) => {
  if (isBrowser) {
    const text = JSON.stringify(JSON_DATA);
    const blob = new Blob([text], {type: 'application/json'});

    const response = await fetchFile(blob);
    t.ok(response, 'fetchFile(Blob) returned response');
    t.equals(response.bodyUsed, false, 'response.bodyUsed is false');

    const headers = response.headers;
    t.ok(headers, 'response has headers');

    t.equals(
      headers.get('content-length'),
      String(text.length),
      'response headers has content-length'
    );
    t.equals(headers.get('content-type'), 'application/json', 'response headers has content-type');

    const json = await response.json();
    t.deepEquals(json, JSON_DATA, 'response.json() returned correct data');
    t.equals(response.bodyUsed, true, 'response.bodyUsed is true');
  }
  t.end();
});

test('fetchFile(Blob)#Response.arrayBuffer() BROWSER ONLY', async (t) => {
  if (isBrowser) {
    const response1 = await fetchFile(BINARY_URL);
    const data = await response1.arrayBuffer();
    t.ok(data instanceof ArrayBuffer, 'fetchFile(Blob) loaded local file into ArrayBuffer');
    t.equals(data.byteLength, 4, 'fetchFile(Blob) loaded local file length correctly');

    const blob = new Blob([data], {type: 'application/octet-stream'});

    const response = await fetchFile(blob);
    t.ok(response, 'fetchFile(Blob) returned response');
    t.equals(response.bodyUsed, false, 'response.bodyUsed is false');

    const headers = response.headers;
    t.ok(headers, 'response has headers');
    t.equals(
      headers.get('content-length'),
      String(data.byteLength),
      'response headers has content-length'
    );
    t.equals(
      headers.get('content-type'),
      'application/octet-stream',
      'response headers has content-type'
    );

    const arrayBuffer = await response.arrayBuffer();
    t.deepEquals(arrayBuffer, data, 'returned response');
    t.equals(response.bodyUsed, true, 'response.bodyUsed is true');
  }
  t.end();
});

test('fetchFile(Blob)#Response.body BROWSER ONLY', async (t) => {
  if (isBrowser) {
    const response1 = await fetchFile(BINARY_URL);
    const data = await response1.arrayBuffer();
    t.ok(data instanceof ArrayBuffer, 'fetchFile(Blob) loaded local file into ArrayBuffer');
    t.equals(data.byteLength, 4, 'fetchFile(Blob) loaded local file length correctly');

    const blob = new Blob([data], {type: 'application/octet-stream'});

    const response = await fetchFile(blob);
    t.ok(response, 'fetchFile(Blob) returned response');
    t.equals(response.bodyUsed, false, 'response.bodyUsed is false');

    const headers = response.headers;
    t.ok(headers, 'response has headers');
    t.equals(
      headers.get('content-length'),
      String(data.byteLength),
      'response headers has content-length'
    );
    t.equals(
      headers.get('content-type'),
      'application/octet-stream',
      'response headers has content-type'
    );

    const stream = response.body;
    t.ok(stream, 'returned stream');
    // t.equals(response.bodyUsed, true, 'response.bodyUsed is true');
  }
  t.end();
});
