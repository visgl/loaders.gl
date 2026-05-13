// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';

import {compareUTF8, parseUTF8BigInt, parseUTF8Boolean, parseUTF8Number} from '@loaders.gl/arrow';

test('UTF8Utils#compareUTF8', t => {
  const bytes = new Uint8Array([
    0x70, 0x72, 0x65, 0x66, 0x69, 0x78, 0x3a, 0x61, 0x70, 0x70, 0x6c, 0x65, 0x7c, 0x62, 0x61, 0x6e,
    0x61, 0x6e, 0x61, 0x7c, 0xc3, 0xa4, 0x70, 0x70, 0x6c, 0x65, 0x7c, 0x61, 0x70, 0x70, 0x6c, 0x65,
    0x3a, 0x65, 0x6e, 0x64
  ]);
  const appleStart = 7;
  const appleEnd = 12;
  const bananaStart = appleEnd + 1;
  const bananaEnd = 19;
  const encodedAppleStart = bananaEnd + 1;
  const encodedAppleEnd = 26;
  const secondAppleStart = encodedAppleEnd + 1;
  const secondAppleEnd = 32;

  t.equal(
    compareUTF8(bytes, appleStart, appleEnd, bytes, secondAppleStart, secondAppleEnd),
    0,
    'compares equal byte ranges'
  );
  t.equal(
    compareUTF8(bytes, appleStart, appleEnd, bytes, bananaStart, bananaEnd),
    -1,
    'orders lower ASCII range before higher ASCII range'
  );
  t.equal(
    compareUTF8(bytes, bananaStart, bananaEnd, bytes, appleStart, appleEnd),
    1,
    'orders higher ASCII range after lower ASCII range'
  );
  t.equal(
    compareUTF8(bytes, appleStart, appleEnd, bytes, encodedAppleStart, encodedAppleEnd),
    -1,
    'orders ASCII bytes before non-ASCII UTF-8 bytes'
  );

  const prefixBytes = new Uint8Array([0x61, 0x7c, 0x61, 0x61]);
  t.equal(compareUTF8(prefixBytes, 0, 1, prefixBytes, 2, 4), -1, 'orders prefix first');
  t.equal(compareUTF8(prefixBytes, 2, 4, prefixBytes, 0, 1), 1, 'orders longer prefix match last');
  t.equal(compareUTF8(prefixBytes, 0, 0, prefixBytes, 0, 0), 0, 'compares empty ranges');
  t.throws(
    () => compareUTF8(prefixBytes, -1, 1, prefixBytes, 0, 1),
    /Invalid UTF-8 byte range/,
    'throws on invalid byte ranges'
  );
  t.throws(
    () => compareUTF8(prefixBytes, 0, 5, prefixBytes, 0, 1),
    /Invalid UTF-8 byte range/,
    'throws when a byte range exceeds the buffer'
  );

  t.end();
});

test('UTF8Utils#parseUTF8Number', t => {
  const bytes = new Uint8Array([
    0x78, 0x7c, 0x2d, 0x34, 0x32, 0x7c, 0x20, 0x20, 0x33, 0x2e, 0x35, 0x65, 0x32, 0x20, 0x20, 0x7c,
    0x2d, 0x2e, 0x32, 0x35, 0x7c, 0x31, 0x2e, 0x7c, 0x2e, 0x7c, 0x31, 0x65, 0x7c, 0x49, 0x6e, 0x66,
    0x69, 0x6e, 0x69, 0x74, 0x79, 0x7c, 0x31, 0x2c, 0x30, 0x30, 0x30, 0x7c, 0x30, 0x2e, 0x33, 0x7c,
    0x79
  ]);

  t.equal(parseUTF8Number(bytes, 2, 5), -42, 'parses signed integer numbers');
  t.equal(parseUTF8Number(bytes, 6, 15), 350, 'parses trimmed decimal exponent numbers');
  t.equal(parseUTF8Number(bytes, 16, 20), -0.25, 'parses leading-decimal numbers');
  t.equal(parseUTF8Number(bytes, 21, 23), 1, 'parses trailing-decimal numbers');
  t.equal(parseUTF8Number(bytes, 24, 25), undefined, 'rejects decimal point without digits');
  t.equal(parseUTF8Number(bytes, 26, 28), undefined, 'rejects exponent without digits');
  t.equal(parseUTF8Number(bytes, 29, 37), undefined, 'rejects Infinity');
  t.equal(parseUTF8Number(bytes, 38, 43), undefined, 'rejects formatted numbers');
  t.equal(parseUTF8Number(bytes, 44, 47), 0.3, 'parses decimals without incremental scale error');
  t.equal(parseUTF8Number(bytes, 0, 0), undefined, 'rejects empty ranges');

  const extraBytes = new Uint8Array([
    0x2b, 0x31, 0x32, 0x7c, 0x31, 0x65, 0x2d, 0x32, 0x7c, 0x31, 0x65, 0x2b, 0x32, 0x7c, 0x09, 0x37,
    0x0d, 0x7c, 0x2b, 0x7c, 0x2d
  ]);
  t.equal(parseUTF8Number(extraBytes, 0, 3), 12, 'parses plus-signed numbers');
  t.equal(parseUTF8Number(extraBytes, 4, 8), 0.01, 'parses negative exponent numbers');
  t.equal(parseUTF8Number(extraBytes, 9, 13), 100, 'parses plus-signed exponent numbers');
  t.equal(parseUTF8Number(extraBytes, 14, 17), 7, 'trims ASCII control whitespace');
  t.equal(parseUTF8Number(extraBytes, 18, 19), undefined, 'rejects plus sign without digits');
  t.equal(parseUTF8Number(extraBytes, 20, 21), undefined, 'rejects minus sign without digits');
  t.throws(
    () => parseUTF8Number(extraBytes, 3, 2),
    /Invalid UTF-8 byte range/,
    'throws on invalid number byte ranges'
  );

  t.end();
});

test('UTF8Utils#parseUTF8BigInt', t => {
  const bytes = new Uint8Array([
    0x78, 0x7c, 0x2d, 0x34, 0x32, 0x7c, 0x20, 0x2b, 0x39, 0x30, 0x30, 0x37, 0x31, 0x39, 0x39, 0x32,
    0x35, 0x34, 0x37, 0x34, 0x30, 0x39, 0x39, 0x33, 0x20, 0x7c, 0x31, 0x32, 0x2e, 0x35, 0x7c, 0x31,
    0x65, 0x33, 0x7c
  ]);

  t.equal(parseUTF8BigInt(bytes, 2, 5), -42n, 'parses signed bigint values');
  t.equal(
    parseUTF8BigInt(bytes, 6, 25),
    9007199254740993n,
    'parses trimmed bigint values beyond safe integer range'
  );
  t.equal(parseUTF8BigInt(bytes, 26, 30), undefined, 'rejects decimal bigint values');
  t.equal(parseUTF8BigInt(bytes, 31, 34), undefined, 'rejects exponent bigint values');
  t.equal(parseUTF8BigInt(bytes, 0, 0), undefined, 'rejects empty ranges');

  const extraBytes = new Uint8Array([0x2b, 0x37, 0x7c, 0x2b, 0x7c, 0x20, 0x2d, 0x20]);
  t.equal(parseUTF8BigInt(extraBytes, 0, 2), 7n, 'parses plus-signed bigint values');
  t.equal(parseUTF8BigInt(extraBytes, 3, 4), undefined, 'rejects plus-only bigint values');
  t.equal(parseUTF8BigInt(extraBytes, 5, 8), undefined, 'rejects minus-only bigint values');
  t.throws(
    () => parseUTF8BigInt(extraBytes, Number.NaN, 1),
    /Invalid UTF-8 byte range/,
    'throws on invalid bigint byte ranges'
  );

  t.end();
});

test('UTF8Utils#parseUTF8Boolean', t => {
  const bytes = new Uint8Array([
    0x78, 0x7c, 0x74, 0x72, 0x75, 0x65, 0x7c, 0x46, 0x41, 0x4c, 0x53, 0x45, 0x7c, 0x20, 0x54, 0x72,
    0x75, 0x65, 0x20, 0x7c, 0x30, 0x7c, 0x79, 0x65, 0x73, 0x7c
  ]);

  t.equal(parseUTF8Boolean(bytes, 2, 6), true, 'parses true');
  t.equal(parseUTF8Boolean(bytes, 7, 12), false, 'parses uppercase false');
  t.equal(parseUTF8Boolean(bytes, 13, 19), true, 'parses mixed-case trimmed true');
  t.equal(parseUTF8Boolean(bytes, 20, 21), undefined, 'rejects numeric booleans');
  t.equal(parseUTF8Boolean(bytes, 22, 25), undefined, 'rejects non-boolean text');
  t.equal(parseUTF8Boolean(bytes, 0, 0), undefined, 'rejects empty ranges');

  const extraBytes = new Uint8Array([
    0x66, 0x61, 0x6c, 0x73, 0x65, 0x7c, 0x54, 0x52, 0x55, 0x45, 0x53
  ]);
  t.equal(parseUTF8Boolean(extraBytes, 0, 5), false, 'parses lowercase false');
  t.equal(parseUTF8Boolean(extraBytes, 6, 11), undefined, 'rejects boolean prefixes');
  t.throws(
    () => parseUTF8Boolean(extraBytes, 0, 12),
    /Invalid UTF-8 byte range/,
    'throws on invalid boolean byte ranges'
  );

  t.end();
});
