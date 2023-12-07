// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Geometry, BinaryGeometry} from '@loaders.gl/schema';

export interface TestCase {
  /** Geometry in WKT */
  wkt: string;

  /** Geometry in WKB, stored in base64 */
  wkb: string;

  /** Geometry in EWKB, stored in base64 */
  ewkb: string;

  /** Geometry in WKB XDR (big endian), stored in base64 */
  wkbXdr: string;

  /** Geometry in EWKB XDR (big endian), stored in base64 */
  ewkbXdr: string;

  /** Geometry in Tiny WKB, stored in base64 */
  twkb: string;

  /** GeoJSON-formatted geometry */
  geoJSON: Geometry;

  /** Geometry in EWKB, stored in base64, without coordinate system identifier */
  ewkbNoSrid: string;

  /** Geometry in EWKB (big endian), stored in base64, without coordinate system identifier */
  ewkbXdrNoSrid: string;

  /** Equivalent data in loaders.gl binary format (but stored as "normal" JS arrays) */
  binary: BinaryGeometry;
}

interface ParsedTestCase {
  /** Geometry in WKT */
  wkt: string;

  /** Geometry in WKB, stored in hex */
  wkbHex: string;

  /** Geometry in WKB */
  wkb: ArrayBuffer;

  /** Geometry in EWKB */
  ewkb: ArrayBuffer;

  /** Geometry in WKB XDR (big endian) */
  wkbXdr: ArrayBuffer;

  /** Geometry in WKB, stored in hex */
  wkbHexXdr: string;

  /** Geometry in EWKB XDR (big endian) */
  ewkbXdr: ArrayBuffer;

  /** Geometry in Tiny WKB */
  twkb: ArrayBuffer;

  /** GeoJSON-formatted geometry */
  geoJSON: Geometry;

  /** Geometry in EWKB, without coordinate system identifier */
  ewkbNoSrid: ArrayBuffer;

  /** Geometry in EWKB (big endian), without coordinate system identifier */
  ewkbXdrNoSrid: ArrayBuffer;

  /** Equivalent data in loaders.gl binary format*/
  binary: BinaryGeometry;
}

/**
 * Convert a hex string to an ArrayBuffer.
 *
 * @param hexString - hex representation of bytes
 * @return Parsed bytes
 */
export default function hexStringToArrayBuffer(hexString: string): ArrayBuffer {
  // remove the leading 0x
  hexString = hexString.replace(/^0x/, '');

  // split the string into pairs of octets
  const pairs = hexString.match(/[\dA-F]{2}/gi);

  // convert the octets to integers
  const integers = pairs ? pairs.map((s) => parseInt(s, 16)) : [];
  return new Uint8Array(integers).buffer;
}

export function parseTestCases(
  testCases: Record<string, TestCase>
): Record<string, ParsedTestCase> {
  const parsedTestCases: Record<string, ParsedTestCase> = {};

  for (const [key, value] of Object.entries(testCases)) {
    const {wkt, wkb, ewkb, wkbXdr, ewkbXdr, twkb, geoJSON, ewkbNoSrid, ewkbXdrNoSrid, binary} =
      value;

    // Convert binary arrays into typedArray
    if (binary && binary.positions) {
      binary.positions.value = new Float64Array(binary.positions.value);
    }
    if (binary && binary.type === 'LineString') {
      binary.pathIndices.value = new Uint16Array(binary.pathIndices.value);
    }
    if (binary && binary.type === 'Polygon') {
      binary.polygonIndices.value = new Uint16Array(binary.polygonIndices.value);
      binary.primitivePolygonIndices.value = new Uint16Array(binary.primitivePolygonIndices.value);
    }

    const parsedTestCase: ParsedTestCase = {
      wkt,
      geoJSON,
      wkbHex: wkb,
      wkbHexXdr: wkbXdr,
      wkb: hexStringToArrayBuffer(wkb),
      ewkb: hexStringToArrayBuffer(ewkb),
      twkb: hexStringToArrayBuffer(twkb),
      wkbXdr: hexStringToArrayBuffer(wkbXdr),
      ewkbXdr: hexStringToArrayBuffer(ewkbXdr),
      ewkbNoSrid: hexStringToArrayBuffer(ewkbNoSrid),
      ewkbXdrNoSrid: hexStringToArrayBuffer(ewkbXdrNoSrid),
      binary
    };

    parsedTestCases[key] = parsedTestCase;
  }

  return parsedTestCases;
}
