// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// This file is forked from https://github.com/feross/buffer under MIT license
import test from 'tape-promise/tape';
import {BufferPolyfill} from '@loaders.gl/parquet';

test('modifying buffer created by .slice() modifies original memory', function (t) {
  const buf1 = new BufferPolyfill(26)
  for (let i = 0; i < 26; i++) {
    buf1[i] = i + 97 // 97 is ASCII a
  }

  const buf2 = buf1.slice(0, 3)
  t.equal(buf2.toString('ascii', 0, buf2.length), 'abc')

  buf2[0] = '!'.charCodeAt(0)
  t.equal(buf1.toString('ascii', 0, buf2.length), '!bc')

  t.end()
})

test('modifying parent buffer modifies .slice() buffer\'s memory', function (t) {
  const buf1 = new BufferPolyfill(26)
  for (let i = 0; i < 26; i++) {
    buf1[i] = i + 97 // 97 is ASCII a
  }

  const buf2 = buf1.slice(0, 3)
  t.equal(buf2.toString('ascii', 0, buf2.length), 'abc')

  buf1[0] = '!'.charCodeAt(0)
  t.equal(buf2.toString('ascii', 0, buf2.length), '!bc')

  t.end()
})
