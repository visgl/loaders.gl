import {expect, test} from 'vitest';
import {decodeDataUri} from '../../src/fetch/decode-data-uri';
const toString = arrayBuffer => new TextDecoder().decode(arrayBuffer);
// eslint-disable-next-line max-statements
test('decodeDataUri', () => {
  let obj;
  let arrayBuffer;
  obj = decodeDataUri('data:text/html;base64,PGh0bWw+');
  expect(obj.mimeType, 'should record down correct MIME type').toBe('text/html');
  obj = decodeDataUri('data:text/plain;base64,SSBsb3ZlIHlvdSE');
  arrayBuffer = obj.arrayBuffer;
  expect(arrayBuffer instanceof ArrayBuffer).toBeTruthy();
  expect(toString(arrayBuffer), 'should work with non-padded base64 data URIs').toBe('I love you!');
  obj = decodeDataUri('data:text/plain;base64,SSBsb3ZlIHlvdSE=');
  arrayBuffer = obj.arrayBuffer;
  expect(arrayBuffer instanceof ArrayBuffer).toBeTruthy();
  expect(toString(arrayBuffer), 'should work with padded base64 data URIs').toBe('I love you!');
  obj = decodeDataUri('data:text/plain,important content!');
  arrayBuffer = obj.arrayBuffer;
  expect(arrayBuffer instanceof ArrayBuffer).toBeTruthy();
  expect(toString(arrayBuffer), 'should work with plain data URIs').toBe('important content!');
  obj = decodeDataUri('data:,important content!');
  expect(obj.mimeType, 'should set default MIME type').toBe('text/plain;charset=US-ASCII');
  arrayBuffer = obj.arrayBuffer;
  expect(arrayBuffer instanceof ArrayBuffer).toBeTruthy();
  expect(toString(arrayBuffer), 'should work with default MIME type').toBe('important content!');
  obj = decodeDataUri('data:;charset=utf-8,important content!');
  expect(obj.mimeType, 'should allow implicit text/plain with charset').toBe(
    'text/plain;charset=utf-8'
  );
  arrayBuffer = obj.arrayBuffer;
  expect(arrayBuffer instanceof ArrayBuffer).toBeTruthy();
  expect(toString(arrayBuffer), 'should allow implicit text/plain with charset').toBe(
    'important content!'
  );
});
