// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {NetCDFReader} from '../../src/netcdfjs/netcdf-reader';

test('NetCDFReader rejects unsupported CDF versions before header parsing', () => {
  const bytes = new Uint8Array([0x43, 0x44, 0x46, 3]);
  expect(() => new NetCDFReader(bytes)).toThrow('unsupported version 3');
});

test('NetCDFReader exposes optional attributes and string values', () => {
  const reader = Object.create(NetCDFReader.prototype) as NetCDFReader;
  reader.header = {
    version: 1,
    recordDimension: {length: 0, id: -1, name: '', recordStep: 0},
    dimensions: [],
    attributes: [
      {name: 'title', type: 'char', value: 'coverage'},
      {name: 'count', type: 'int', value: 2}
    ],
    variables: []
  } as any;

  expect(reader.getAttribute('title')).toBe('coverage');
  expect(reader.getAttribute('missing')).toBeNull();
  reader.getDataVariable = vi.fn(() => null) as any;
  expect(reader.getDataVariableAsString('missing')).toBeNull();
});

test('NetCDFReader stringifies dimensions, attributes, and bounded variable previews', () => {
  const reader = Object.create(NetCDFReader.prototype) as NetCDFReader;
  reader.header = {
    version: 2,
    recordDimension: {length: 0, id: -1, name: '', recordStep: 0},
    dimensions: [{name: 'observations', size: 100}],
    attributes: [{name: 'title', type: 'char', value: 'coverage'}],
    variables: [
      {
        name: 'values',
        dimensions: [0],
        attributes: [],
        type: 'int',
        size: 400,
        offset: 0,
        record: false
      }
    ]
  } as any;
  reader.getDataVariable = vi.fn(() => Array.from({length: 30}, (_value, index) => index));

  const description = reader.toString();

  expect(description).toContain('DIMENSIONS');
  expect(description).toContain('observations');
  expect(description).toContain('GLOBAL ATTRIBUTES');
  expect(description).toContain('coverage');
  expect(description).toContain('VARIABLES:');
  expect(description).toContain('(length: 30)');
  expect(reader.version).toBe('64-bit offset format');
});

test('NetCDFReader includes missing names in variable diagnostics', () => {
  const reader = Object.create(NetCDFReader.prototype) as NetCDFReader;
  reader.header = {variables: []} as any;
  expect(() => reader.getDataVariable('missing')).toThrow('variable not found: missing');
});
