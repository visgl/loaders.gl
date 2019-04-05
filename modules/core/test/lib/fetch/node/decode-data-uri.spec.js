// This code is based on binary-gltf-utils
// Copyright (c) 2016-17 Karl Cheng, MIT license

/* eslint-disable max-len, max-statements */
/* global Buffer */
import test from 'tape-promise/tape';
import {isBrowser} from '@loaders.gl/core';
import decodeDataUri from '@loaders.gl/core/lib/fetch/node/decode-data-uri';

test('decodeDataUri', t => {
  if (isBrowser) {
    t.comment('decodeDataUri() currently only works in Node.js');
    t.end();
    return;
  }

  let obj;
  let buf;

  obj = decodeDataUri('data:text/html;base64,PGh0bWw+');
  t.equals(obj.mimeType, 'text/html', 'should record down correct MIME type');

  obj = decodeDataUri('data:text/plain;base64,SSBsb3ZlIHlvdSE');
  buf = obj.buffer;
  t.ok(Buffer.isBuffer(buf));
  t.equals(buf.toString(), 'I love you!', 'should work with non-padded base64 data URIs');

  obj = decodeDataUri('data:text/plain;base64,SSBsb3ZlIHlvdSE=');
  buf = obj.buffer;
  t.ok(Buffer.isBuffer(buf));
  t.equals(buf.toString(), 'I love you!', 'should work with padded base64 data URIs');

  obj = decodeDataUri('data:text/plain,important content!');
  buf = obj.buffer;
  t.ok(Buffer.isBuffer(buf));
  t.equals(buf.toString(), 'important content!', 'should work with plain data URIs');

  obj = decodeDataUri('data:,important content!');
  t.equals(obj.mimeType, 'text/plain;charset=US-ASCII', 'should set default MIME type');

  buf = obj.buffer;
  t.ok(Buffer.isBuffer(buf));
  t.equals(buf.toString(), 'important content!', 'should work with default MIME type');

  obj = decodeDataUri('data:;charset=utf-8,important content!');
  t.equals(
    obj.mimeType,
    'text/plain;charset=utf-8',
    'should allow implicit text/plain with charset'
  );

  buf = obj.buffer;
  t.ok(Buffer.isBuffer(buf));
  t.equals(buf.toString(), 'important content!', 'should allow implicit text/plain with charset');

  t.end();
});
