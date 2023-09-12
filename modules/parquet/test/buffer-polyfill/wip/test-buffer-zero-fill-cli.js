'use strict';
var Buffer = require('../../').Buffer;
// Flags: --zero-fill-buffers

// when using --zero-fill-buffers, every Buffer and SlowBuffer
// instance must be zero filled upon creation

require('./common');
const SlowBuffer = require('../../').SlowBuffer;
const assert = require('assert');

function isZeroFilled(buf) {
  for (let n = 0; n < buf.length; n++)
    if (buf[n] > 0) return false;
  return true;
}

// This can be somewhat unreliable because the
// allocated memory might just already happen to
// contain all zeroes. The test is run multiple
// times to improve the reliability.
for (let i = 0; i < 50; i++) {
  const bufs = [
    Buffer.alloc(20),
    Buffer.allocUnsafe(20),
    SlowBuffer(20),
    Buffer(20),
    new SlowBuffer(20)
  ];
  for (const buf of bufs) {
    assert(isZeroFilled(buf));
  }
}

