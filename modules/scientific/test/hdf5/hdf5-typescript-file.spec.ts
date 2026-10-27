// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {hdf5Checksum} from '../../src/hdf5/hdf5-binary';
import {HDF5TypeScriptFile} from '../../src/hdf5/hdf5-typescript-source';

/** Encode a v2 object header with compact messages into a small test file. */
function writeObjectHeader(
  bytes: Uint8Array,
  offset: number,
  messages: readonly {type: number; payload: Uint8Array}[]
): void {
  const chunk = Uint8Array.from(
    messages.flatMap(({type, payload}) => [type, payload.length, 0, 0, ...payload])
  );
  bytes.set([79, 72, 68, 82, 2, 0, chunk.length], offset);
  bytes.set(chunk, offset + 7);
}

/** Build a minimal v3 HDF5 file with one compact link and numeric dataset. */
function makeNumericFile(chunked = false): Uint8Array {
  const bytes = new Uint8Array(1024);
  const view = new DataView(bytes.buffer);
  bytes.set([137, 72, 68, 70, 13, 10, 26, 10, 3, 8, 8, 0]);
  view.setBigUint64(12, 0n, true);
  view.setBigUint64(20, 0xffffffffffffffffn, true);
  view.setBigUint64(28, BigInt(bytes.length), true);
  view.setBigUint64(36, 128n, true);
  view.setUint32(44, hdf5Checksum(bytes.subarray(0, 44)), true);

  const link = new Uint8Array(17);
  link.set([1, 0, 6, 118, 97, 108, 117, 101, 115]);
  new DataView(link.buffer).setBigUint64(9, 256n, true);
  writeObjectHeader(bytes, 128, [{type: 6, payload: link}]);

  const dataspace = new Uint8Array(12);
  dataspace.set([2, 1]);
  new DataView(dataspace.buffer).setBigUint64(4, 2n, true);
  const datatype = new Uint8Array(12);
  datatype[0] = 0x11;
  new DataView(datatype.buffer).setUint32(4, 4, true);
  const layout = new Uint8Array(chunked ? 16 : 18);
  if (chunked) {
    layout.set([4, 2, 0, 2, 1, 2, 4, 1]);
    new DataView(layout.buffer).setBigUint64(8, 512n, true);
  } else {
    layout.set([3, 1]);
    new DataView(layout.buffer).setBigUint64(2, 512n, true);
    new DataView(layout.buffer).setBigUint64(10, 8n, true);
  }
  writeObjectHeader(bytes, 256, [
    {type: 1, payload: dataspace},
    {type: 3, payload: datatype},
    {type: 8, payload: layout}
  ]);
  view.setFloat32(512, 1.5, true);
  view.setFloat32(516, -2.25, true);
  return bytes;
}

test('TypeScript HDF5 reader follows compact links to contiguous numeric data', async () => {
  const file = await HDF5TypeScriptFile.fromBytes(makeNumericFile());
  expect(await file.resolvePath('/')).toBe(128n);
  expect(await file.resolvePath('/values')).toBe(256n);
  const dataset = await file.readDataset('/values');
  expect(dataset.shape).toEqual([2]);
  expect(Array.from(dataset.data as Float32Array)).toEqual([1.5, -2.25]);
  await expect(file.resolvePath('values')).rejects.toThrow(/absolute dataset path/);
  await expect(file.resolvePath('/../values')).rejects.toThrow(/invalid path/);
  await expect(file.resolvePath('/missing')).rejects.toThrow(/not found/);
});

test('TypeScript HDF5 reader selects a single unfiltered chunk', async () => {
  const file = await HDF5TypeScriptFile.fromBytes(makeNumericFile(true));
  const dataset = await file.readChunkedDataset('/values', [[1, 2]]);
  expect(dataset.shape).toEqual([1]);
  expect(Array.from(dataset.data as Float32Array)).toEqual([-2.25]);
});

test('TypeScript HDF5 reader rejects truncated contiguous payloads', async () => {
  const bytes = makeNumericFile();
  const file = await HDF5TypeScriptFile.fromBytes(bytes.subarray(0, 516));
  await expect(file.readDataset('/values')).rejects.toThrow(/byte range outside input/);
});
