// loaders.gl, MIT license
// Copyright (c) vis.gl contributors
// This file is forked from https://github.com/feross/buffer under MIT license
import test from 'tape-promise/tape';
import {BufferPolyfill} from '@loaders.gl/parquet';

test('is-buffer tests', function (t) {
  t.ok(BufferPolyfill.isBuffer(new BufferPolyfill(4)), 'new Buffer(4)')

  t.notOk(BufferPolyfill.isBuffer(undefined), 'undefined')
  t.notOk(BufferPolyfill.isBuffer(null), 'null')
  t.notOk(BufferPolyfill.isBuffer(''), 'empty string')
  t.notOk(BufferPolyfill.isBuffer(true), 'true')
  t.notOk(BufferPolyfill.isBuffer(false), 'false')
  t.notOk(BufferPolyfill.isBuffer(0), '0')
  t.notOk(BufferPolyfill.isBuffer(1), '1')
  t.notOk(BufferPolyfill.isBuffer(1.0), '1.0')
  t.notOk(BufferPolyfill.isBuffer('string'), 'string')
  t.notOk(BufferPolyfill.isBuffer({}), '{}')
  t.notOk(BufferPolyfill.isBuffer(function foo () {}), 'function foo () {}')

  t.end()
})
