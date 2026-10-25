// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import test from 'tape-promise/tape';
import {parseGRIB2, GRIB2Source} from '../../src/grib2';

function section(number: number, size: number): Uint8Array {
  const data = new Uint8Array(size);
  new DataView(data.buffer).setUint32(0, size);
  data[4] = number;
  return data;
}
function fixture(): Uint8Array {
  const indicator = new Uint8Array(16);
  indicator.set([71, 82, 73, 66], 0);
  indicator[7] = 2;
  const identification = section(1, 21);
  const grid = section(3, 72);
  const g = new DataView(grid.buffer);
  g.setUint32(6, 4);
  g.setUint16(12, 0);
  g.setUint32(30, 2);
  g.setUint32(34, 2);
  const product = section(4, 34);
  product[9] = 2; product[10] = 3;
  const representation = section(5, 21);
  const r = new DataView(representation.buffer);
  r.setUint32(5, 4);
  r.setUint16(9, 0);
  r.setFloat32(11, 10);
  representation[19] = 8;
  const bitmap = section(6, 6);
  bitmap[5] = 255;
  const values = section(7, 9);
  values.set([1, 2, 3, 4], 5);
  const ending = new Uint8Array([55, 55, 55, 55]);
  const parts = [indicator, identification, grid, product, representation, bitmap, values, ending];
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  new DataView(indicator.buffer).setBigUint64(8, BigInt(length));
  const output = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {output.set(part, offset); offset += part.length;}
  return output;
}
test('GRIB2 simple packing and scientific selection', async t => {
  const input = fixture();
  const messages = parseGRIB2(input);
  t.equal(messages.length, 1);
  t.deepEqual(Array.from(messages[0].values), [11, 12, 13, 14]);
  const source = new GRIB2Source(input);
  const metadata = await source.getScientificMetadata();
  t.equal(metadata.variables[0].name, 'message_0');
  const array = await source.readScientificVariable('message_0', {x_0: [1, 2]});
  t.deepEqual(Array.from(array.data as Float32Array), [12, 14]);
  t.deepEqual(array.shape, [2, 1]);
  t.throws(() => parseGRIB2(input.subarray(0, input.length - 1)), /invalid message length/);
  t.end();
});
