// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// This file is forked from https://github.com/feross/buffer under MIT license
import test from 'tape-promise/tape';
import {BufferPolyfill} from '@loaders.gl/parquet';

test('detect utf16 surrogate pairs', function (t) {
  const text = '\uD83D\uDE38' + '\uD83D\uDCAD' + '\uD83D\uDC4D'
  const buf = new BufferPolyfill(text)
  t.equal(text, buf.toString())
  t.end()
})

test('detect utf16 surrogate pairs over U+20000 until U+10FFFF', function (t) {
  const text = '\uD842\uDFB7' + '\uD93D\uDCAD' + '\uDBFF\uDFFF'
  const buf = new BufferPolyfill(text)
  t.equal(text, buf.toString())
  t.end()
})

test('replace orphaned utf16 surrogate lead code point', function (t) {
  const text = '\uD83D\uDE38' + '\uD83D' + '\uD83D\uDC4D'
  const buf = new BufferPolyfill(text)
  t.deepEqual(buf, new BufferPolyfill([0xf0, 0x9f, 0x98, 0xb8, 0xef, 0xbf, 0xbd, 0xf0, 0x9f, 0x91, 0x8d]))
  t.end()
})

test('replace orphaned utf16 surrogate trail code point', function (t) {
  const text = '\uD83D\uDE38' + '\uDCAD' + '\uD83D\uDC4D'
  const buf = new BufferPolyfill(text)
  t.deepEqual(buf, new BufferPolyfill([0xf0, 0x9f, 0x98, 0xb8, 0xef, 0xbf, 0xbd, 0xf0, 0x9f, 0x91, 0x8d]))
  t.end()
})

test('do not write partial utf16 code units', function (t) {
  const f = new BufferPolyfill([0, 0, 0, 0, 0])
  t.equal(f.length, 5)
  const size = f.write('あいうえお', 'utf16le')
  t.equal(size, 4)
  t.deepEqual(f, new BufferPolyfill([0x42, 0x30, 0x44, 0x30, 0x00]))
  t.end()
})

// eslint-disable-next-line max-statements
test('handle partial utf16 code points when encoding to utf8 the way node does', function (t) {
  const text = '\uD83D\uDE38' + '\uD83D\uDC4D'

  let buf = new BufferPolyfill(8)
  buf.fill(0)
  buf.write(text)
  t.deepEqual(buf, new BufferPolyfill([0xf0, 0x9f, 0x98, 0xb8, 0xf0, 0x9f, 0x91, 0x8d]))

  buf = new BufferPolyfill(7)
  buf.fill(0)
  buf.write(text)
  t.deepEqual(buf, new BufferPolyfill([0xf0, 0x9f, 0x98, 0xb8, 0x00, 0x00, 0x00]))

  buf = new BufferPolyfill(6)
  buf.fill(0)
  buf.write(text)
  t.deepEqual(buf, new BufferPolyfill([0xf0, 0x9f, 0x98, 0xb8, 0x00, 0x00]))

  buf = new BufferPolyfill(5)
  buf.fill(0)
  buf.write(text)
  t.deepEqual(buf, new BufferPolyfill([0xf0, 0x9f, 0x98, 0xb8, 0x00]))

  buf = new BufferPolyfill(4)
  buf.fill(0)
  buf.write(text)
  t.deepEqual(buf, new BufferPolyfill([0xf0, 0x9f, 0x98, 0xb8]))

  buf = new BufferPolyfill(3)
  buf.fill(0)
  buf.write(text)
  t.deepEqual(buf, new BufferPolyfill([0x00, 0x00, 0x00]))

  buf = new BufferPolyfill(2)
  buf.fill(0)
  buf.write(text)
  t.deepEqual(buf, new BufferPolyfill([0x00, 0x00]))

  buf = new BufferPolyfill(1)
  buf.fill(0)
  buf.write(text)
  t.deepEqual(buf, new BufferPolyfill([0x00]))

  t.end()
})

// eslint-disable-next-line max-statements
test('handle invalid utf16 code points when encoding to utf8 the way node does', function (t) {
  const text = 'a' + '\uDE38\uD83D' + 'b'

  let buf = new BufferPolyfill(8)
  buf.fill(0)
  buf.write(text)
  t.deepEqual(buf, new BufferPolyfill([0x61, 0xef, 0xbf, 0xbd, 0xef, 0xbf, 0xbd, 0x62]))

  buf = new BufferPolyfill(7)
  buf.fill(0)
  buf.write(text)
  t.deepEqual(buf, new BufferPolyfill([0x61, 0xef, 0xbf, 0xbd, 0xef, 0xbf, 0xbd]))

  buf = new BufferPolyfill(6)
  buf.fill(0)
  buf.write(text)
  t.deepEqual(buf, new BufferPolyfill([0x61, 0xef, 0xbf, 0xbd, 0x00, 0x00]))

  buf = new BufferPolyfill(5)
  buf.fill(0)
  buf.write(text)
  t.deepEqual(buf, new BufferPolyfill([0x61, 0xef, 0xbf, 0xbd, 0x00]))

  buf = new BufferPolyfill(4)
  buf.fill(0)
  buf.write(text)
  t.deepEqual(buf, new BufferPolyfill([0x61, 0xef, 0xbf, 0xbd]))

  buf = new BufferPolyfill(3)
  buf.fill(0)
  buf.write(text)
  t.deepEqual(buf, new BufferPolyfill([0x61, 0x00, 0x00]))

  buf = new BufferPolyfill(2)
  buf.fill(0)
  buf.write(text)
  t.deepEqual(buf, new BufferPolyfill([0x61, 0x00]))

  buf = new BufferPolyfill(1)
  buf.fill(0)
  buf.write(text)
  t.deepEqual(buf, new BufferPolyfill([0x61]))

  t.end()
})
