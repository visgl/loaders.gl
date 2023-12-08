// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// This file is forked from https://github.com/feross/buffer under MIT license
import test from 'tape-promise/tape';
import {BufferPolyfill} from '@loaders.gl/parquet';

test('Buffer.isEncoding', function (t) {
  t.equal(BufferPolyfill.isEncoding('HEX'), true)
  t.equal(BufferPolyfill.isEncoding('hex'), true)
  t.equal(BufferPolyfill.isEncoding('bad'), false)
  t.end()
})

test('Buffer.isBuffer', function (t) {
  t.equal(BufferPolyfill.isBuffer(new BufferPolyfill('hey', 'utf8')), true)
  // @ts-expect-error TODO should be supported
  t.equal(BufferPolyfill.isBuffer(new BufferPolyfill([1, 2, 3], 'utf8')), true)
  t.equal(BufferPolyfill.isBuffer('hey'), false)
  t.end()
})
