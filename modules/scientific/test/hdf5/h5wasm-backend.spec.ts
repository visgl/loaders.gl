// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {isHDF5, openH5WasmBackend} from '../../src/hdf5/h5wasm-backend';

test('HDF5 file decoder: real WASM roundtrip and slicing', async () => {
  const h5wasm = await import('h5wasm');
  const {FS} = await h5wasm.ready;
  const filename = '/scientific-roundtrip-test.h5';
  const file = new h5wasm.File(filename, 'w');
  file.create_group('wind');
  file.get('wind').create_dataset({
    name: 'u',
    data: new Float32Array([1, 2, 3, 4, 5, 6]),
    shape: [2, 3],
    dtype: '<f',
    chunks: [1, 3],
    compression: 1
  });
  file.create_dataset({name: 'counts', data: new Int32Array([1, -2]), shape: [2], dtype: '<i4'});
  file.create_dataset({name: 'precision', data: new Float64Array([1.25]), shape: [1], dtype: '<d'});
  file.create_dataset({name: 'labels', data: ['north', 'south']});
  file.close();
  const bytes = FS.readFile(filename);
  FS.unlink(filename);
  expect(isHDF5(bytes)).toBe(true);
  const backend = await openH5WasmBackend(bytes);
  const {HDF5Source} = await import('../../src/hdf5/hdf5-source');
  const source = new HDF5Source(backend);
  const metadata = await source.getScientificMetadata();
  expect(metadata.variables.map(variable => variable.name)).toContain('/wind/u');
  expect(metadata.variables.find(variable => variable.name === '/counts')?.dtype).toBe('int32');
  expect(metadata.variables.find(variable => variable.name === '/precision')?.dtype).toBe(
    'float64'
  );
  expect(Array.from((await source.readScientificVariable('/counts')).data as Int32Array)).toEqual([
    1, -2
  ]);
  expect(
    Array.from((await source.readScientificVariable('/precision')).data as Float64Array)
  ).toEqual([1.25]);
  await expect(source.readScientificVariable('/labels')).rejects.toThrow(/numeric typed array/);
  const slice = await source.readScientificVariable('/wind/u', {'/wind/u:dim_1': [1, 3]});
  expect(Array.from(slice.data as Float32Array)).toEqual([2, 3, 5, 6]);
  await source.close();
  await source.close();
  await expect(source.getScientificMetadata()).rejects.toThrow(/closed/);
  await expect(openH5WasmBackend(new Uint8Array(16))).rejects.toThrow(/signature/);
});
