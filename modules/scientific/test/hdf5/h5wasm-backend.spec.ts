// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import test from 'tape-promise/tape';
import {isHDF5, openH5WasmBackend} from '../../src/hdf5/h5wasm-backend';

test('HDF5 file decoder: real WASM roundtrip and slicing', async t => {
  const h5wasm = await import('h5wasm');
  const {FS} = await h5wasm.ready;
  const filename = '/scientific-roundtrip-test.h5';
  const file = new h5wasm.File(filename, 'w');
  file.create_group('wind');
  file.get('wind').create_dataset({
    name: 'u', data: new Float32Array([1, 2, 3, 4, 5, 6]),
    shape: [2, 3], dtype: '<f', chunks: [1, 3], compression: 1
  });
  file.close();
  const bytes = FS.readFile(filename);
  FS.unlink(filename);
  t.ok(isHDF5(bytes));
  const backend = await openH5WasmBackend(bytes);
  const {HDF5Source} = await import('../../src/hdf5/hdf5-source');
  const source = new HDF5Source(backend);
  const metadata = await source.getScientificMetadata();
  t.equal(metadata.variables[0].name, '/wind/u');
  const slice = await source.readScientificVariable('/wind/u', {'/wind/u:dim_1': [1, 3]});
  t.deepEqual(Array.from(slice.data as Float32Array), [2, 3, 5, 6]);
  await source.close();
  await t.rejects(source.getScientificMetadata(), /closed/);
  await t.rejects(openH5WasmBackend(new Uint8Array(16)), /signature/);
  t.end();
});
