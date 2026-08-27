// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {IOBuffer} from '../src/iobuffer/iobuffer';
import {readRecord} from '../src/netcdfjs/read-data';
import type {
  NetCDFDimension,
  NetCDFRecordDimension,
  NetCDFVariable
} from '../src/netcdfjs/netcdf-types';

test('readRecord excludes four-byte padding from short record variables', () => {
  const buffer = new IOBuffer(new Uint8Array([0, 10, 0, 0, 0, 20, 0, 0])).setBigEndian();
  const variable: NetCDFVariable = {
    name: 'value',
    dimensions: [0, 1],
    attributes: [],
    type: 'short',
    size: 4,
    offset: 0,
    record: true
  };
  const recordDimension: NetCDFRecordDimension = {
    length: 2,
    id: 0,
    name: 'record',
    recordStep: 4
  };
  const dimensions: NetCDFDimension[] = [
    {name: 'record', size: 0, recordId: 0, recordName: 'record'},
    {name: 'sample', size: 1, recordId: 0, recordName: 'record'}
  ];

  expect(readRecord(buffer, variable, recordDimension, dimensions)).toEqual([10, 20]);
});
