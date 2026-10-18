// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {IOBuffer} from '../../src/netcdf/iobuffer/iobuffer';
import {readNetCDFHeader} from '../../src/netcdf/netcdfjs/read-header';

test('NetCDF header accepts empty dimension, attribute, and variable lists', () => {
  const buffer = new IOBuffer(28).setBigEndian();
  for (const value of [0, 0, 0, 0, 0, 0, 0]) buffer.writeUint32(value);
  buffer.rewind();

  const header = readNetCDFHeader(buffer, 1);
  expect(header.dimensions).toEqual([]);
  expect(header.attributes).toEqual([]);
  expect(header.variables).toEqual([]);
});

test.each([
  {words: [0, 0, 1], message: 'wrong empty tag for list of dimensions'},
  {words: [0, 9], message: 'wrong tag for list of dimensions'},
  {words: [0, 0, 0, 0, 1], message: 'wrong empty tag for list of attributes'},
  {words: [0, 0, 0, 9], message: 'wrong tag for list of attributes'},
  {words: [0, 0, 0, 0, 0, 0, 1], message: 'wrong empty tag for list of variables'},
  {words: [0, 0, 0, 0, 0, 9], message: 'wrong tag for list of variables'}
])('NetCDF header rejects $message', ({words, message}) => {
  const buffer = new IOBuffer(words.length * 4).setBigEndian();
  for (const value of words) buffer.writeUint32(value);
  buffer.rewind();

  expect(() => readNetCDFHeader(buffer, 1)).toThrow(message);
});
