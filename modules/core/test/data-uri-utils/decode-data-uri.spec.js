// This code is based on binary-gltf-utils
// Copyright (c) 2016-17 Karl Cheng, MIT license

/* eslint-disable max-len, max-statements */
import test from 'tape-promise/tape';
import {isBrowser, isArrayBuffer, TextDecoder} from '@loaders.gl/core';
import {decodeDataUri} from '@loaders.gl/core/fetch-file/fetch-file-node';

export function toString(arrayBuffer) {
  const textDecoder = new TextDecoder();
  return textDecoder.decode(arrayBuffer);
}

test('decodeDataUri', t => {
  if (isBrowser) {
    t.comment('decodeDataUri() only implemented in node.js');
    t.end();
  }
  let result;
  let arrayBuffer;

  result = decodeDataUri('data:text/html;base64,PGh0bWw+');
  t.equals(result.mimeType, 'text/html', 'should record down correct MIME type');

  result = decodeDataUri('data:text/plain;base64,SSBsb3ZlIHlvdSE');
  arrayBuffer = result.arrayBuffer;
  t.ok(isArrayBuffer(arrayBuffer));
  t.equals(toString(arrayBuffer), 'I love you!', 'should work with non-padded base64 data URIs');

  result = decodeDataUri('data:text/plain;base64,SSBsb3ZlIHlvdSE=');
  arrayBuffer = result.arrayBuffer;
  t.ok(isArrayBuffer(arrayBuffer));
  t.equals(toString(arrayBuffer), 'I love you!', 'should work with padded base64 data URIs');

  result = decodeDataUri('data:text/plain,important content!');
  arrayBuffer = result.arrayBuffer;
  t.ok(isArrayBuffer(arrayBuffer));
  t.equals(toString(arrayBuffer), 'important content!', 'should work with plain data URIs');

  result = decodeDataUri('data:,important content!');
  t.equals(result.mimeType, 'text/plain;charset=US-ASCII', 'should set default MIME type');

  arrayBuffer = result.arrayBuffer;
  t.ok(isArrayBuffer(arrayBuffer));
  t.equals(toString(arrayBuffer), 'important content!', 'should work with default MIME type');

  result = decodeDataUri('data:;charset=utf-8,important content!');
  t.equals(
    result.mimeType,
    'text/plain;charset=utf-8',
    'should allow implicit text/plain with charset'
  );

  arrayBuffer = result.arrayBuffer;
  t.ok(isArrayBuffer(arrayBuffer));
  t.equals(toString(arrayBuffer), 'important content!', 'should allow implicit text/plain with charset');

  t.end();
});
