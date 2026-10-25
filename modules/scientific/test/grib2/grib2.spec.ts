// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {parseGRIB2, GRIB2Source} from '../../src/grib2';

/** Create a GRIB2 section with its length and section number. */
function createSection(number: number, size: number): Uint8Array {
  const data = new Uint8Array(size);
  new DataView(data.buffer).setUint32(0, size);
  data[4] = number;
  return data;
}
/** Create a small GRIB2 message using simple packing. */
function createFixture(binaryScale = 0, decimalScale = 0): Uint8Array {
  const indicator = new Uint8Array(16);
  indicator.set([71, 82, 73, 66], 0);
  indicator[7] = 2;
  const identification = createSection(1, 21);
  const grid = createSection(3, 72);
  const gridView = new DataView(grid.buffer);
  gridView.setUint32(6, 4);
  gridView.setUint16(12, 0);
  gridView.setUint32(30, 2);
  gridView.setUint32(34, 2);
  const product = createSection(4, 34);
  product[9] = 2;
  product[10] = 3;
  const representation = createSection(5, 21);
  const representationView = new DataView(representation.buffer);
  representationView.setUint32(5, 4);
  representationView.setUint16(9, 0);
  representationView.setFloat32(11, 10);
  representationView.setUint16(15, binaryScale);
  representationView.setUint16(17, decimalScale);
  representation[19] = 8;
  const bitmap = createSection(6, 6);
  bitmap[5] = 255;
  const values = createSection(7, 9);
  values.set([1, 2, 3, 4], 5);
  const ending = new Uint8Array([55, 55, 55, 55]);
  const parts = [indicator, identification, grid, product, representation, bitmap, values, ending];
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  new DataView(indicator.buffer).setBigUint64(8, BigInt(length));
  const output = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}
test('GRIB2 simple packing and scientific selection', async () => {
  const input = createFixture();
  const messages = parseGRIB2(input);
  expect(messages).toHaveLength(1);
  expect(Array.from(messages[0].values)).toEqual([11, 12, 13, 14]);
  const source = new GRIB2Source(input);
  const metadata = await source.getScientificMetadata();
  expect(metadata.variables[0].name).toBe('message_0');
  const array = await source.readScientificVariable('message_0', {x_0: [1, 2]});
  expect(Array.from(array.data as Float32Array)).toEqual([12, 14]);
  expect(array.shape).toEqual([2, 1]);
  expect(() => parseGRIB2(input.subarray(0, input.length - 1))).toThrow(/invalid message length/);
});

test('GRIB2 simple packing scales encoded values without scaling the reference', () => {
  const messages = parseGRIB2(createFixture(1, 1));
  expect(Array.from(messages[0].values)).toEqual([
    Math.fround(1.2),
    Math.fround(1.4),
    Math.fround(1.6),
    Math.fround(1.8)
  ]);
});

test('GRIB2 decodes an independent ecCodes regular latitude/longitude sample', () => {
  // ecCodes regular_ll_sfc_grib2.tmpl (Apache-2.0), 179 bytes:
  // https://github.com/ecmwf/eccodes/blob/develop/samples/regular_ll_sfc_grib2.tmpl
  const sampleBase64 =
    'R1JJQv//AAIAAAAAAAAAswAAABUBAGIAAAQAAQfXAxcMAAAAAgAAAEgDAAAAAfAAAAAABv///////////////////wAAABAAAAAfAAAAAP////8Dk4cAAAAAADAAAAAAAcnDgAAehIAAHoSAAAAAACIEAAAAAAAAAP+AAAAAAQAAAAAB//////////////8AAAAVBQAAAfAAAEOIkzMAAAAAAAAAAAAGBv8AAAAFBzc3Nzc=';
  const sample = Uint8Array.from(atob(sampleBase64), character => character.charCodeAt(0));
  const [message] = parseGRIB2(sample);
  expect(message.grid).toEqual({width: 16, height: 31, scanningMode: 0});
  expect(message.values).toHaveLength(496);
  expect(Array.from(message.values).every(value => value === Math.fround(273.15))).toBe(true);
});
