// loaders.gl, MIT license
// This file is forked from https://github.com/feross/buffer under MIT license
import test from 'tape-promise/tape';
import {BufferPolyfill} from '@loaders.gl/parquet';

test('buffer.compare', function (t) {
  const b = new BufferPolyfill(1).fill('a')
  const c = new BufferPolyfill(1).fill('c')
  const d = new BufferPolyfill(2).fill('aa')

  t.equal(b.compare(c), -1)
  t.equal(c.compare(d), 1)
  t.equal(d.compare(b), 1)
  t.equal(b.compare(d), -1)

  // static method
  t.equal(BufferPolyfill.compare(b, c), -1)
  t.equal(BufferPolyfill.compare(c, d), 1)
  t.equal(BufferPolyfill.compare(d, b), 1)
  t.equal(BufferPolyfill.compare(b, d), -1)
  t.end()
})

test('buffer.compare argument validation', function (t) {
  t.throws(function () {
    const b = new BufferPolyfill(1)
    BufferPolyfill.compare(b, 'abc')
  })

  t.throws(function () {
    const b = new BufferPolyfill(1)
    BufferPolyfill.compare('abc', b)
  })

  t.throws(function () {
    const b = new BufferPolyfill(1)
    b.compare('abc')
  })
  t.end()
})

test('buffer.equals', function (t) {
  const b = new BufferPolyfill(5).fill('abcdf')
  const c = new BufferPolyfill(5).fill('abcdf')
  const d = new BufferPolyfill(5).fill('abcde')
  const e = new BufferPolyfill(6).fill('abcdef')

  t.ok(b.equals(c))
  t.ok(!c.equals(d))
  t.ok(!d.equals(e))
  t.end()
})

test('buffer.equals argument validation', function (t) {
  t.throws(function () {
    const b = new BufferPolyfill(1)
    b.equals('abc')
  })
  t.end()
})
