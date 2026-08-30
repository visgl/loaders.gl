// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {HexEncoder} from '../../src/lib/utils/hex-encoder';
import {
  getCoordinateByteSize,
  getGeometryTypeFromWKBType,
  getWKBTypeFromGeometryType,
  matchWKBOptionsToPointSize
} from '../../src/lib/geometry-converters/wkb/helpers/wkb-utils';
import {
  getWKTGeometryType,
  isTWKB,
  isWKB,
  isWKT,
  parseWKBHeader
} from '../../src/lib/geometry-converters/wkb/helpers/parse-wkb-header';
import {
  EWKB_FLAG_M,
  EWKB_FLAG_SRID,
  EWKB_FLAG_Z,
  WKBGeometryType
} from '../../src/lib/geometry-converters/wkb/helpers/wkb-types';

/** Encodes a compact WKB header for little- or big-endian boundary tests. */
function makeHeader(geometryCode: number, littleEndian = true, srid?: number): ArrayBuffer {
  const arrayBuffer = new ArrayBuffer(srid === undefined ? 5 : 9);
  const dataView = new DataView(arrayBuffer);
  dataView.setUint8(0, littleEndian ? 1 : 0);
  dataView.setUint32(1, geometryCode, littleEndian);
  if (srid !== undefined) dataView.setUint32(5, srid, littleEndian);
  return arrayBuffer;
}

describe('WKB helper boundary behavior', () => {
  test('encodes and decodes upper- and lower-case hexadecimal bytes', () => {
    const encoder = new HexEncoder();
    const input = new Uint8Array([0, 15, 16, 171, 255]);
    const encoded = encoder.encode(input, new Uint8Array(encoder.getEncodedLength(input)));
    expect(new TextDecoder().decode(encoded)).toBe('000F10ABFF');
    expect(
      encoder.decode(
        new TextEncoder().encode('000f10abff'),
        new Uint8Array(encoder.getDecodedLength(encoded))
      )
    ).toEqual(input);
    expect(encoder.getDecodedLength(new Uint8Array(3))).toBe(2);
  });

  test('maps geometry types and normalizes dimension options', () => {
    for (const geometryType of Object.values(WKBGeometryType).filter(
      (value): value is WKBGeometryType => typeof value === 'number'
    )) {
      const name = getGeometryTypeFromWKBType(geometryType);
      expect(getWKBTypeFromGeometryType(name)).toBe(geometryType);
    }
    expect(() => getGeometryTypeFromWKBType(99 as WKBGeometryType)).toThrow('99');
    expect(matchWKBOptionsToPointSize(4)).toMatchObject({hasZ: true, hasM: true});
    expect(matchWKBOptionsToPointSize(3, {hasZ: true, hasM: true})).toMatchObject({
      hasZ: true,
      hasM: false
    });
    expect(matchWKBOptionsToPointSize(3, {hasM: true})).toMatchObject({hasZ: false, hasM: true});
    expect(matchWKBOptionsToPointSize(3)).toMatchObject({hasZ: true, hasM: false});
    expect(matchWKBOptionsToPointSize(2, {hasZ: true, hasM: true})).toMatchObject({
      hasZ: false,
      hasM: false
    });
    expect(matchWKBOptionsToPointSize(1, {srid: 4326})).toMatchObject({srid: 4326});
    expect(getCoordinateByteSize()).toBe(16);
    expect(getCoordinateByteSize({hasZ: true})).toBe(24);
    expect(getCoordinateByteSize({hasZ: true, hasM: true})).toBe(32);
  });

  test('recognizes WKT, TWKB, and valid WKB dialect headers', () => {
    expect(isWKT('POINT(1 2)')).toBe(true);
    expect(getWKTGeometryType(new TextEncoder().encode('MULTIPOLYGON(').buffer)).toBe(
      WKBGeometryType.MultiPolygon
    );
    expect(isWKT(' point(1 2)')).toBe(false);
    expect(isTWKB(new Uint8Array([1]).buffer)).toBe(true);
    expect(isTWKB(new Uint8Array([0]).buffer)).toBe(false);
    expect(isTWKB(new Uint8Array([8]).buffer)).toBe(false);
    expect(isWKB(makeHeader(1))).toBe(true);
    expect(isWKB(makeHeader(1002, false))).toBe(true);
    expect(isWKB(makeHeader(EWKB_FLAG_Z | 1))).toBe(true);
    expect(isWKB(makeHeader(EWKB_FLAG_SRID | 1, true, 4326))).toBe(true);
    expect(isWKB(makeHeader(1, true))).toBe(true);
    const invalidEndian = new Uint8Array(makeHeader(1));
    invalidEndian[0] = 2;
    expect(isWKB(invalidEndian.buffer)).toBe(false);
    expect(isWKB(makeHeader(0))).toBe(false);
    expect(isWKB(makeHeader(8))).toBe(false);
    expect(isWKB(makeHeader(4001))).toBe(false);
    expect(isWKB(makeHeader(EWKB_FLAG_SRID | 1, true, 20_000))).toBe(false);
  });

  test('parses ISO and EWKB dimensions, byte order, SRID, and target offsets', () => {
    expect(parseWKBHeader(new DataView(makeHeader(1)))).toMatchObject({
      variant: 'wkb',
      geometryType: 1,
      dimensions: 2,
      coordinates: 'xy',
      littleEndian: true,
      byteOffset: 5
    });
    expect(parseWKBHeader(new DataView(makeHeader(1002, false)))).toMatchObject({
      variant: 'iso-wkb',
      geometryType: 2,
      coordinates: 'xyz',
      littleEndian: false
    });
    expect(parseWKBHeader(new DataView(makeHeader(2003)))).toMatchObject({coordinates: 'xym'});
    expect(parseWKBHeader(new DataView(makeHeader(3004)))).toMatchObject({coordinates: 'xyzm'});
    expect(parseWKBHeader(new DataView(makeHeader(EWKB_FLAG_Z | 1)))).toMatchObject({
      variant: 'ewkb',
      coordinates: 'xyz'
    });
    expect(parseWKBHeader(new DataView(makeHeader(EWKB_FLAG_M | 1)))).toMatchObject({
      variant: 'ewkb',
      coordinates: 'xym'
    });
    expect(parseWKBHeader(new DataView(makeHeader(EWKB_FLAG_Z | EWKB_FLAG_M | 1)))).toMatchObject({
      variant: 'ewkb',
      coordinates: 'xyzm'
    });
    expect(parseWKBHeader(new DataView(makeHeader(EWKB_FLAG_SRID | 1, true, 4326)))).toMatchObject({
      variant: 'ewkb',
      srid: 4326,
      byteOffset: 9
    });

    const padded = new Uint8Array(10);
    padded.set(new Uint8Array(makeHeader(2)), 2);
    const target = {byteOffset: 2} as any;
    expect(parseWKBHeader(new DataView(padded.buffer), target)).toBe(target);
    expect(target.byteOffset).toBe(7);
    expect(() =>
      parseWKBHeader(new DataView(new TextEncoder().encode('POINT(1 2)').buffer))
    ).toThrow('Cannot parse WKT');
    expect(() => parseWKBHeader(new DataView(makeHeader(4001)))).toThrow(
      'Unsupported iso-wkb type'
    );
  });
});
