import {expect, test, vi} from 'vitest';
import {parseSHPHeader} from '../src/lib/parsers/parse-shp-header';
import {BinaryReader} from '../src/lib/streaming/binary-reader';

test('parseSHPHeader reads mixed-endian fields and bounding boxes', () => {
  const buffer = new ArrayBuffer(100);
  const view = new DataView(buffer);
  view.setInt32(0, 0x0000270a, false);
  view.setInt32(24, 50, false);
  view.setInt32(28, 1000, true);
  view.setInt32(32, 5, true);
  view.setFloat64(36, -10, true);
  view.setFloat64(44, -20, true);
  view.setFloat64(52, 30, true);
  view.setFloat64(60, 40, true);
  view.setFloat64(68, -1, true);
  view.setFloat64(76, 2, true);
  view.setFloat64(84, -3, true);
  view.setFloat64(92, 4, true);

  expect(parseSHPHeader(view)).toEqual({
    magic: 0x0000270a,
    length: 100,
    version: 1000,
    type: 5,
    bbox: {minX: -10, minY: -20, minZ: -1, minM: -3, maxX: 30, maxY: 40, maxZ: 2, maxM: 4}
  });
});

test('parseSHPHeader reports malformed magic and version', () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  const buffer = new ArrayBuffer(100);
  const view = new DataView(buffer);
  view.setInt32(28, 999, true);

  parseSHPHeader(view);

  expect(error).toHaveBeenCalledTimes(2);
  error.mockRestore();
});

test('BinaryReader exposes bounded views and supports skip/rewind', () => {
  const reader = new BinaryReader(new Uint8Array([1, 2, 3, 4]).buffer);

  expect(reader.hasAvailableBytes(4)).toBe(true);
  expect(reader.getDataView(2).getUint8(1)).toBe(2);
  reader.skip(1);
  expect(reader.getDataView(1).getUint8(0)).toBe(4);
  reader.rewind(2);
  expect(reader.offset).toBe(2);
  expect(() => reader.getDataView(3)).toThrow('binary data exhausted');
});
