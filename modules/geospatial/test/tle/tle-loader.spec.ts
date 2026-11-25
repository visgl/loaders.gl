// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeAll, describe, expect, test, vi} from 'vitest';
import * as arrow from 'apache-arrow';
import {validateLoader} from 'test/common/conformance';
import {fetchFile, parse} from '@loaders.gl/core';
import type {ObjectRowTable} from '@loaders.gl/core/schema';
import {OMM_COLUMNS, type OMMRow} from '../../src/omm/omm-schema';
import {TLEFormat, TLELoader} from '@loaders.gl/geospatial/tle';
import {TLELoaderWithParser} from '@loaders.gl/geospatial/tle/bundled';
import {computeTLEChecksum, convertTLEToOMMRow, parseTLEText} from '../../src/tle/tle-parser';

const TLE_URL = '@loaders.gl/geospatial/tle/test/data/stations.tle';
const OMM_JSON_URL = '@loaders.gl/geospatial/omm/test/data/stations.omm.json';
const ISS = 25544;

let tleText: string;
let tleLines: string[];
let ommObjects: OMMRow[];

beforeAll(async () => {
  tleText = await (await fetchFile(TLE_URL)).text();
  tleLines = tleText.split('\n').filter(line => line.length > 0);
  ommObjects = JSON.parse(await (await fetchFile(OMM_JSON_URL)).text());
});

/** Parses TLE text to rows with the parser-bearing loader. */
function parseRows(text: string, options: Record<string, unknown> = {}): OMMRow[] {
  const table = TLELoaderWithParser.parseTextSync(text, {
    tle: {shape: 'object-row-table', ...options}
  }) as ObjectRowTable;
  return table.data as OMMRow[];
}

/** Replaces columns of a TLE line (1-based, inclusive) and recomputes the checksum. */
function editLine(line: string, firstColumn: number, value: string): string {
  const edited =
    line.slice(0, firstColumn - 1) + value + line.slice(firstColumn - 1 + value.length);
  return edited.slice(0, 68) + computeTLEChecksum(edited);
}

/** The ISS set: name line, line 1 and line 2. */
function getISSLines(): [string, string, string] {
  return [tleLines[0], tleLines[1], tleLines[2]];
}

describe('TLELoader', () => {
  test('loader conformance', () => {
    validateLoader(TLELoader, 'TLELoader');
    validateLoader(TLELoaderWithParser, 'TLELoaderWithParser');
  });

  test('parses three-line TLE text into an Arrow table by default', async () => {
    const table = (await parse(tleText, TLELoader)) as arrow.Table;
    expect(table).toBeInstanceOf(arrow.Table);
    expect(table.numRows).toBe(13);
    expect(table.schema.fields.map(field => field.name)).toEqual(
      OMM_COLUMNS.map(column => column.name)
    );
    expect(table.getChild('OBJECT_NAME')!.get(0)).toBe('ISS (ZARYA)');
    expect(table.getChild('NORAD_CAT_ID')!.get(0)).toBe(ISS);
    expect(TLEFormat.tests[0](new TextEncoder().encode(tleText).buffer)).toBe(true);
    expect(TLEFormat.tests[0](new TextEncoder().encode('{"a": 1}').buffer)).toBe(false);
  });

  test('converts the ISS set to OMM names and units', () => {
    const [iss] = parseRows(tleText);
    expect(iss).toEqual({
      OBJECT_NAME: 'ISS (ZARYA)',
      OBJECT_ID: '1998-067A',
      NORAD_CAT_ID: 25544,
      EPOCH: '2026-11-23T21:54:38.454048',
      MEAN_MOTION: 15.49568558,
      ECCENTRICITY: 0.0007379,
      INCLINATION: 51.6322,
      RA_OF_ASC_NODE: 229.652,
      ARG_OF_PERICENTER: 58.6021,
      MEAN_ANOMALY: 301.5689,
      EPHEMERIS_TYPE: 0,
      CLASSIFICATION_TYPE: 'U',
      ELEMENT_SET_NO: 999,
      REV_AT_EPOCH: 59651,
      BSTAR: 0.00010921,
      MEAN_MOTION_DOT: 0.00005691,
      MEAN_MOTION_DDOT: 0
    });
  });

  test('gives the same elements as OMM JSON for the same objects', () => {
    const rows = parseRows(tleText);
    expect(rows).toHaveLength(13);
    for (const row of rows) {
      const omm = ommObjects.find(object => object.NORAD_CAT_ID === row.NORAD_CAT_ID)!;
      expect(omm, String(row.NORAD_CAT_ID)).toBeDefined();
      for (const keyword of [
        'OBJECT_NAME',
        'OBJECT_ID',
        'EPOCH',
        'EPHEMERIS_TYPE',
        'CLASSIFICATION_TYPE',
        'ELEMENT_SET_NO',
        'REV_AT_EPOCH',
        'MEAN_MOTION',
        'INCLINATION',
        'RA_OF_ASC_NODE',
        'ARG_OF_PERICENTER',
        'MEAN_ANOMALY'
      ] as const) {
        expect(row[keyword], `${row.NORAD_CAT_ID} ${keyword}`).toBe(omm[keyword]);
      }
      // OMM JSON can have more digits than the TLE fields.
      // CelesTrak cuts the eccentricity to 7 digits in TLE output.
      expect(Math.abs(row.ECCENTRICITY - omm.ECCENTRICITY)).toBeLessThan(1.0001e-7);
      expect(row.MEAN_MOTION_DOT).toBeCloseTo(omm.MEAN_MOTION_DOT!, 8);
      for (const keyword of ['BSTAR', 'MEAN_MOTION_DDOT'] as const) {
        const tolerance = Math.abs(omm[keyword]!) * 1e-4;
        expect(
          Math.abs(row[keyword]! - omm[keyword]!),
          `${row.NORAD_CAT_ID} ${keyword}`
        ).toBeLessThanOrEqual(tolerance);
      }
    }
  });

  test('parses the two-line form, the 0 name prefix, CRLF and blank lines', () => {
    const twoLineText = tleLines.filter((_, index) => index % 3 !== 0).join('\n');
    const twoLineRows = parseRows(twoLineText);
    expect(twoLineRows).toHaveLength(13);
    expect(twoLineRows[0].OBJECT_NAME).toBeNull();
    expect(twoLineRows[0].NORAD_CAT_ID).toBe(ISS);

    const crlfText = `\r\n${tleLines.map((line, index) => (index % 3 === 0 ? `0 ${line}` : line)).join('\r\n\r\n')}\r\n`;
    const rows = parseRows(crlfText);
    expect(rows).toEqual(parseRows(tleText));
  });

  test('reads Alpha-5 catalog numbers', () => {
    const [, line1, line2] = getISSLines();
    const rows = parseRows(
      ['SOYUZ-MS 29', editLine(line1, 3, 'A0057'), editLine(line2, 3, 'A0057')].join('\n')
    );
    expect(rows[0].NORAD_CAT_ID).toBe(100057);
    expect(rows[0].OBJECT_NAME).toBe('SOYUZ-MS 29');
    const omm = ommObjects.find(object => object.NORAD_CAT_ID === 100057)!;
    expect(omm.OBJECT_NAME).toBe('SOYUZ-MS 29');
  });

  test.each([
    ['57001.50000000', '1957-01-01T12:00:00.000000'],
    ['56366.00000000', '2056-12-31T00:00:00.000000'],
    ['00001.00000000', '2000-01-01T00:00:00.000000'],
    ['99365.99999999', '1999-12-31T23:59:59.999136']
  ])('reads epoch %s with the year pivot 57', (epoch, expected) => {
    const [, line1, line2] = getISSLines();
    const [row] = parseRows([editLine(line1, 19, epoch), line2].join('\n'));
    expect(row.EPOCH).toBe(expected);
  });

  test('reads implied-decimal exponent fields with signs', () => {
    const [, line1, line2] = getISSLines();
    const editedLine1 = editLine(editLine(line1, 34, '-.00002182'), 45, '-11606-4');
    const [row] = parseRows([editLine(editedLine1, 54, '+12345+1'), line2].join('\n'));
    expect(row.MEAN_MOTION_DOT).toBe(-0.00002182);
    expect(row.MEAN_MOTION_DDOT).toBe(-0.000011606);
    expect(row.BSTAR).toBe(1.2345);
    const [blank] = parseRows([editLine(editLine(line1, 63, ' '), 1, '1'), line2].join('\n'));
    expect(blank.EPHEMERIS_TYPE).toBe(0);
  });

  test('validates checksums unless the option turns it off', () => {
    const [name, line1, line2] = getISSLines();
    const badLine1 = `${line1.slice(0, 68)}0`;
    expect(computeTLEChecksum(line1)).toBe(3);
    expect(computeTLEChecksum(line2)).toBe(9);
    expect(() => parseRows([name, badLine1, line2].join('\n'))).toThrow(
      'TLELoader: line 2: checksum error on TLE line 1: found "0", computed 3'
    );
    const badLine2 = `${line2.slice(0, 68)}0`;
    expect(() => parseRows([name, line1, badLine2].join('\n'))).toThrow(
      'TLELoader: line 3: checksum error on TLE line 2'
    );
    expect(
      parseRows([name, badLine1, badLine2].join('\n'), {validateChecksum: false})
    ).toHaveLength(1);
  });

  test.each([
    [(lines: string[]) => [lines[0], lines[1]], 'line 2: TLE line 1 is not followed by TLE line 2'],
    [(lines: string[]) => [lines[0], lines[2]], 'line 2: TLE line 2 has no TLE line 1 before it'],
    [
      (lines: string[]) => [lines[1], lines[2], lines[0]],
      'line 3: name line "ISS (ZARYA)" is not followed by TLE line 1'
    ],
    [(lines: string[]) => [lines[2]], 'line 1: TLE line 2 has no TLE line 1 before it'],
    [
      (lines: string[]) => [lines[1].slice(0, 60), lines[2]],
      'line 1: TLE line 1 must have 69 characters, found 60'
    ],
    [
      (lines: string[]) => [lines[1], editLine(lines[2], 3, '25545')],
      'line 2: catalog number 25545 on TLE line 2 does not agree with 25544'
    ],
    [
      (lines: string[]) => [editLine(lines[1], 3, 'I0001'), editLine(lines[2], 3, 'I0001')],
      'line 1: invalid catalog number "I0001"'
    ],
    [
      (lines: string[]) => [lines[1], editLine(lines[2], 9, ' 51.6x22')],
      'line 2: INCLINATION: invalid number " 51.6x22"'
    ],
    [
      (lines: string[]) => [lines[1], editLine(lines[2], 27, '00x7379')],
      'line 2: ECCENTRICITY: invalid number "00x7379"'
    ],
    [
      (lines: string[]) => [editLine(lines[1], 45, ' 0000x+0'), lines[2]],
      'line 1: MEAN_MOTION_DDOT: invalid number " 0000x+0"'
    ],
    [
      (lines: string[]) => [editLine(lines[1], 65, ' 9x9'), lines[2]],
      'line 1: ELEMENT_SET_NO: invalid integer " 9x9"'
    ],
    [
      (lines: string[]) => [editLine(lines[1], 10, '98067a  '), lines[2]],
      'line 1: invalid international designator'
    ],
    [
      (lines: string[]) => [editLine(lines[1], 19, '26400.00000000'), lines[2]],
      'line 1: invalid epoch day of year 400'
    ],
    [
      (lines: string[]) => [editLine(lines[1], 19, '26366.00000000'), lines[2]],
      'line 1: invalid epoch day of year 366'
    ],
    [
      (lines: string[]) => [editLine(lines[1], 19, '26327x91294507'), lines[2]],
      'line 1: invalid epoch'
    ],
    [
      (lines: string[]) => [lines[1], editLine(lines[2], 53, ' 0.00000000')],
      'line 2: MEAN_MOTION must be positive'
    ]
  ])('reports malformed input with the line number (%#)', (makeLines, message) => {
    expect(() => parseRows(makeLines(getISSLines()).join('\n'))).toThrow(`TLELoader: ${message}`);
  });

  test('skips invalid sets with a warning', () => {
    const warnings: string[] = [];
    const log = {warn: vi.fn((message: string) => () => warnings.push(message))};
    const lines = [...tleLines];
    lines[1] = `${lines[1].slice(0, 68)}0`;
    lines.push('2 99999  51.6322');
    const table = TLELoaderWithParser.parseTextSync(lines.join('\n'), {
      core: {log: log as never},
      tle: {shape: 'object-row-table', skipInvalidRecords: true}
    }) as ObjectRowTable;
    expect(table.data).toHaveLength(12);
    expect(warnings).toEqual([
      'TLELoader: line 2: checksum error on TLE line 1: found "0", computed 3 (record skipped)',
      'TLELoader: line 40: TLE line 2 has no TLE line 1 before it (record skipped)'
    ]);
    const skipped = parseTLEText(['NAME', tleLines[1], 'NAME 2', 'NAME 3'].join('\n'), {
      skipInvalidRecords: true,
      log: log as never
    });
    expect(skipped).toEqual([]);
    expect(log.warn).toHaveBeenCalledTimes(5);
  });

  test('returns an empty table for empty input', async () => {
    expect(parseRows('')).toEqual([]);
    expect(parseRows('\r\n\n  \n')).toEqual([]);
    const table = (await TLELoaderWithParser.parse(new ArrayBuffer(0), {})) as arrow.Table;
    expect(table.numRows).toBe(0);
    const syncTable = TLELoaderWithParser.parseSync(
      new TextEncoder().encode(tleText).buffer,
      {}
    ) as arrow.Table;
    expect(syncTable.numRows).toBe(13);
  });

  test('convertTLEToOMMRow converts one set', () => {
    const [, line1, line2] = getISSLines();
    const row = convertTLEToOMMRow(line1, line2);
    expect(row.OBJECT_NAME).toBeNull();
    expect(row.NORAD_CAT_ID).toBe(ISS);
    expect(convertTLEToOMMRow(editLine(line1, 10, '        '), line2).OBJECT_ID).toBeNull();
  });
});
