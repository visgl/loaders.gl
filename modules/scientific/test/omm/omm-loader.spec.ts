// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeAll, describe, expect, test, vi} from 'vitest';
import * as arrow from 'apache-arrow';
import {validateLoader} from 'test/common/conformance';
import {fetchFile, parse} from '@loaders.gl/core';
import type {ObjectRowTable} from '@loaders.gl/core/schema';
import {OMMFormat, OMMLoader, type OMMRow} from '@loaders.gl/scientific/omm';
import {OMMLoaderWithParser} from '@loaders.gl/scientific/omm/bundled';
import {OMM_COLUMNS, OMM_SCHEMA} from '../../src/omm/omm-schema';
import {parseAlpha5CatalogNumber, parseOMMEpoch} from '../../src/omm/orbit-record-utils';
import {parseOMMText} from '../../src/omm/omm-parser';

const OMM_JSON_URL = '@loaders.gl/scientific/omm/test/data/stations.omm.json';
const OMM_KVN_URL = '@loaders.gl/scientific/omm/test/data/stations.omm';

/** GP metadata values omitted from the CelesTrak JSON fixture. */
const GP_METADATA = {
  CENTER_NAME: 'EARTH',
  REF_FRAME: 'TEME',
  TIME_SYSTEM: 'UTC',
  MEAN_ELEMENT_THEORY: 'SGP4'
};

let jsonText: string;
let sourceObjects: Record<string, unknown>[];

beforeAll(async () => {
  jsonText = await (await fetchFile(OMM_JSON_URL)).text();
  sourceObjects = JSON.parse(jsonText);
});

/** Parses OMM text to rows with the parser-bearing loader. */
function parseRows(text: string, options: Record<string, unknown> = {}): OMMRow[] {
  const table = OMMLoaderWithParser.parseTextSync(text, {
    omm: {shape: 'object-row-table', ...options}
  }) as ObjectRowTable;
  return table.data as OMMRow[];
}

/** Returns a copy of the ISS element set with some fields changed. */
function makeObject(changes: Record<string, unknown>): Record<string, unknown> {
  return {...sourceObjects[0], ...changes};
}

/** Serializes one test element set as KVN. */
function makeKVNText(object: Record<string, unknown>): string {
  const lines = Object.entries(object).map(([keyword, value]) => `${keyword} = ${value}`);
  return ['CCSDS_OMM_VERS = 2.0', ...lines].join('\n');
}

describe('OMMLoader', () => {
  test('loader conformance', () => {
    validateLoader(OMMLoader, 'OMMLoader');
    validateLoader(OMMLoaderWithParser, 'OMMLoaderWithParser');
  });

  test('returns an Arrow table with the OMM schema by default', async () => {
    const table = (await parse(jsonText, OMMLoader)) as arrow.Table;
    expect(table).toBeInstanceOf(arrow.Table);
    expect(table.numRows).toBe(16);
    expect(table.schema.fields.map(field => field.name)).toEqual(
      OMM_COLUMNS.map(column => column.name)
    );
    expect(
      table.schema.fields.find(field => field.name === 'MEAN_MOTION')?.metadata.get('unit')
    ).toBe('rev/day');
    expect(arrow.DataType.isInt(table.getChild('NORAD_CAT_ID')!.type)).toBe(true);
    expect(table.getChild('OBJECT_NAME')!.get(0)).toBe('ISS (ZARYA)');
    expect(table.getChild('NORAD_CAT_ID')!.get(13)).toBe(100057);
    expect(table.getChild('MEAN_MOTION')!.get(0)).toBe(15.49568558);
  });

  test('returns rows equal to the CelesTrak JSON objects', () => {
    const table = OMMLoaderWithParser.parseTextSync(jsonText, {
      omm: {shape: 'object-row-table'}
    }) as ObjectRowTable;
    expect(table.shape).toBe('object-row-table');
    expect(table.schema).toBe(OMM_SCHEMA);
    expect(table.data).toEqual(sourceObjects);
    const iss = table.data[0] as OMMRow;
    expect(new Date(parseOMMEpoch(iss.EPOCH)).toISOString()).toBe('2026-11-23T21:54:38.454Z');
  });

  test('parses the KVN form', async () => {
    const kvnText = await (await fetchFile(OMM_KVN_URL)).text();
    const rows = parseRows(kvnText);
    expect(rows).toEqual([sourceObjects[0], sourceObjects[13]]);
    expect(OMMFormat.tests[0](new TextEncoder().encode(kvnText).buffer)).toBe(true);
  });

  test('reads KVN keywords between metadata and data delimiters', () => {
    const {OBJECT_NAME: objectName, ...elements} = sourceObjects[0];
    const kvnText = makeKVNText({OBJECT_NAME: objectName, ...elements});
    const [versionLine, objectNameLine, ...dataLines] = kvnText.split('\n');
    const delimitedText = [
      versionLine,
      '  META_START  ',
      objectNameLine,
      'META_STOP',
      'DATA_START',
      ...dataLines,
      'DATA_STOP'
    ].join('\n');
    expect(parseRows(delimitedText)).toEqual(parseRows(kvnText));
  });

  test.each(['COVARIANCE', 'USER_DEFINED'])('ignores KVN keywords in a %s block', blockName => {
    const kvnText = makeKVNText(sourceObjects[0]);
    const block = [
      `${blockName}_START`,
      'OTHER_STOP',
      'EPOCH = 2026-01-01T00:00:00',
      'CX_X = 0.01',
      `  ${blockName}_STOP  `
    ].join('\n');
    const withBlock = kvnText.replace(/^MEAN_ANOMALY = .*$/m, line => `${block}\n${line}`);
    expect(parseRows(withBlock)).toEqual(parseRows(kvnText));
  });

  test.each([
    {boundary: 'end of input', hasNextRecord: false},
    {boundary: 'next OMM header', hasNextRecord: true}
  ])('reports and skips a KVN record with a block open at the $boundary', ({hasNextRecord}) => {
    const firstRecord = makeKVNText(sourceObjects[0]);
    const nextRecord = sourceObjects[13];
    const blockStartLine = firstRecord.split('\n').length + 1;
    const lines = [firstRecord, 'COVARIANCE_START', 'CX_X = 0.01'];
    if (hasNextRecord) {
      lines.push(makeKVNText(nextRecord));
    }
    const text = lines.join('\n');
    const message = `OMMLoader: line ${blockStartLine}: unterminated block, expected COVARIANCE_STOP`;
    expect(() => parseRows(text)).toThrow(message);

    const log = {warn: vi.fn(() => () => {})};
    expect(parseOMMText(text, {skipInvalidRecords: true, log: log as never})).toEqual(
      hasNextRecord ? [nextRecord] : []
    );
    expect(log.warn).toHaveBeenCalledExactlyOnceWith(`${message} (record skipped)`);
  });

  test('rejects a stray KVN stop delimiter as a malformed line', () => {
    const text = `COVARIANCE_STOP\n${makeKVNText(sourceObjects[0])}`;
    expect(() => parseRows(text, {skipInvalidRecords: true})).toThrow(
      'OMMLoader: line 1: expected "KEYWORD = value", found "COVARIANCE_STOP"'
    );
  });

  test.each([
    ['explicit values', GP_METADATA],
    [
      'lower-case values with surrounding whitespace',
      {
        CENTER_NAME: ' earth ',
        REF_FRAME: ' teme ',
        TIME_SYSTEM: ' utc ',
        MEAN_ELEMENT_THEORY: ' sgp4 '
      }
    ],
    ['the SGP/SGP4 alias', {...GP_METADATA, MEAN_ELEMENT_THEORY: 'SGP/SGP4'}],
    ['blank values', {CENTER_NAME: '', REF_FRAME: ' ', TIME_SYSTEM: '', MEAN_ELEMENT_THEORY: ''}]
  ])('returns the same rows as omitted GP metadata for %s', (_label, metadata) => {
    const object = makeObject(metadata);
    expect(parseRows(JSON.stringify(object))).toEqual(parseRows(JSON.stringify(sourceObjects[0])));
    expect(parseRows(makeKVNText(object))).toEqual(parseRows(makeKVNText(sourceObjects[0])));
  });

  test.each([
    ['TIME_SYSTEM', 'TAI'],
    ['REF_FRAME', 'EME2000'],
    ['CENTER_NAME', 'MOON'],
    ['MEAN_ELEMENT_THEORY', 'SGP4-XP']
  ])('rejects incompatible GP metadata %s = %s in JSON and KVN', (keyword, value) => {
    const object = makeObject({[keyword]: value});
    expect(() => parseRows(JSON.stringify([sourceObjects[0], object]))).toThrow(
      `OMMLoader: element set 2: ${keyword} must be`
    );
    const kvnText = makeKVNText(object);
    const lineNumber = kvnText.split('\n').findIndex(line => line.startsWith(`${keyword} = `)) + 1;
    expect(() => parseRows(kvnText)).toThrow(`OMMLoader: line ${lineNumber}: ${keyword} must be`);
  });

  test('accepts one object, numeric strings, a byte order mark and the ArrayBuffer API', async () => {
    const stringObject = Object.fromEntries(
      Object.entries(sourceObjects[0]).map(([key, value]) => [key, String(value)])
    );
    expect(parseRows(`﻿${JSON.stringify(stringObject)}`)).toEqual([sourceObjects[0]]);

    const arrayBuffer = new TextEncoder().encode(jsonText).buffer;
    const table = (await OMMLoaderWithParser.parse(arrayBuffer, {
      omm: {shape: 'object-row-table'}
    })) as ObjectRowTable;
    expect(table.data).toHaveLength(16);
    expect((OMMLoaderWithParser.parseSync(arrayBuffer, {}) as arrow.Table).numRows).toBe(16);
    expect(OMMFormat.tests[0](arrayBuffer)).toBe(true);
    expect(OMMFormat.tests[0](new TextEncoder().encode('{"a": 1}').buffer)).toBe(false);
  });

  test('sets missing optional fields to null', () => {
    const [row] = parseRows(
      JSON.stringify([
        {
          EPOCH: '2026-327T21:54:38.454048Z',
          MEAN_MOTION: 1.0027,
          ECCENTRICITY: 0,
          INCLINATION: 0.05,
          RA_OF_ASC_NODE: 0,
          ARG_OF_PERICENTER: 0,
          MEAN_ANOMALY: 0,
          NORAD_CAT_ID: 'A0057'
        }
      ])
    );
    expect(row.OBJECT_NAME).toBeNull();
    expect(row.BSTAR).toBeNull();
    expect(row.NORAD_CAT_ID).toBe(100057);
    expect(parseOMMEpoch(row.EPOCH)).toBe(Date.UTC(2026, 10, 23, 21, 54, 38, 454));
  });

  test('returns an empty table for empty input', () => {
    expect(parseRows('')).toEqual([]);
    expect(parseRows(' \n ')).toEqual([]);
    expect(parseRows('[]')).toEqual([]);
    const table = OMMLoaderWithParser.parseTextSync('', {}) as arrow.Table;
    expect(table.numRows).toBe(0);
    expect(table.schema.fields).toHaveLength(OMM_COLUMNS.length);
  });

  test.each([
    [{MEAN_MOTION: undefined}, 'element set 2: required keyword MEAN_MOTION is missing'],
    [{ECCENTRICITY: 1.2}, 'element set 2: ECCENTRICITY must be in the range [0, 1), found 1.2'],
    [{INCLINATION: 190}, 'INCLINATION must be in the range [0, 180]'],
    [{MEAN_MOTION: -1}, 'MEAN_MOTION must be positive'],
    [{BSTAR: 'abc'}, 'BSTAR must be a number, found "abc"'],
    [{BSTAR: true}, 'BSTAR must be a number'],
    [{REV_AT_EPOCH: 1.5}, 'REV_AT_EPOCH must be an integer'],
    [{EPOCH: '23 Nov 2026'}, 'invalid epoch "23 Nov 2026"'],
    [{EPOCH: '2026-13-01T00:00:00'}, 'invalid epoch'],
    [{NORAD_CAT_ID: -5}, 'invalid catalog number -5'],
    [{NORAD_CAT_ID: 'I0001'}, 'invalid catalog number "I0001"']
  ])('reports an invalid element set: %j', (changes, message) => {
    const text = JSON.stringify([sourceObjects[0], makeObject(changes)]);
    expect(() => parseRows(text)).toThrow(message);
  });

  test('skips invalid element sets with a warning', () => {
    const warnings: string[] = [];
    const log = {warn: vi.fn((message: string) => () => warnings.push(message))};
    const text = JSON.stringify([sourceObjects[0], makeObject({ECCENTRICITY: 2}), 42]);
    const table = OMMLoaderWithParser.parseTextSync(text, {
      core: {log: log as never},
      omm: {shape: 'object-row-table', skipInvalidRecords: true}
    }) as ObjectRowTable;
    expect(table.data).toHaveLength(1);
    expect(warnings).toEqual([
      'OMMLoader: element set 2: ECCENTRICITY must be in the range [0, 1), found 2 (record skipped)',
      'OMMLoader: element set 3: an element set must be a JSON object (record skipped)'
    ]);

    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(parseOMMText('[1]', {skipInvalidRecords: true})).toEqual([]);
    expect(consoleWarn).toHaveBeenCalledOnce();
    consoleWarn.mockRestore();
  });

  test('reads KVN units and long lines in linear time', async () => {
    const kvnText = await (await fetchFile(OMM_KVN_URL)).text();
    const withUnit = kvnText.replace(/^INCLINATION = (\S+).*$/m, 'INCLINATION =   $1   [deg]');
    expect(parseRows(withUnit)[0].INCLINATION).toBe(parseRows(kvnText)[0].INCLINATION);

    const longLine = `OBJECT_NAME = A${' '.repeat(200_000)}B${' '.repeat(200_000)}[`;
    const start = performance.now();
    expect(() => parseRows(kvnText.replace(/^OBJECT_NAME = .*$/m, longLine))).not.toThrow(
      'expected "KEYWORD = value"'
    );
    expect(performance.now() - start).toBeLessThan(1000);
  });

  test('reports KVN errors with the line number', async () => {
    const kvnText = await (await fetchFile(OMM_KVN_URL)).text();
    const badText = kvnText.replace('ECCENTRICITY = 0.0007379', 'ECCENTRICITY = 1.5');
    const badLine = badText.split('\n').findIndex(line => line.startsWith('ECCENTRICITY')) + 1;
    expect(() => parseRows(badText)).toThrow(
      `OMMLoader: line ${badLine}: ECCENTRICITY must be in the range [0, 1)`
    );
    expect(() => parseRows(kvnText.replace('OBJECT_ID = 1998-067A', 'not a keyword'))).toThrow(
      'OMMLoader: line 7: expected "KEYWORD = value", found "not a keyword"'
    );
    expect(() =>
      parseRows(kvnText.replace('REF_FRAME = TEME', 'EPOCH = 2026-01-01T00:00:00'))
    ).toThrow('keyword EPOCH appears twice in one element set');
    expect(() => parseRows(kvnText.replace(/^MEAN_ANOMALY = .*$/m, ''))).toThrow(
      'OMMLoader: line 1: required keyword MEAN_ANOMALY is missing'
    );

    const log = {warn: vi.fn(() => () => {})};
    const table = OMMLoaderWithParser.parseTextSync(badText, {
      core: {log: log as never},
      omm: {shape: 'object-row-table', skipInvalidRecords: true}
    }) as ObjectRowTable;
    expect(table.data.map(row => row.NORAD_CAT_ID)).toEqual([100057]);
    const duplicateText = kvnText.replace('REF_FRAME = TEME', 'EPOCH = 2026-01-01T00:00:00');
    expect(parseOMMText(duplicateText, {skipInvalidRecords: true, log: log as never})).toHaveLength(
      1
    );
    expect(log.warn).toHaveBeenCalledTimes(2);
  });

  test('reports unsupported or broken documents', () => {
    expect(() => parseRows('[{"EPOCH": ')).toThrow('OMMLoader: invalid JSON');
    expect(() => parseRows('<?xml version="1.0"?><ndm/>')).toThrow(
      'the OMM XML form is not supported'
    );
    expect(() =>
      OMMLoaderWithParser.parseTextSync(jsonText, {omm: {shape: 'geojson-table' as never}})
    ).toThrow('Unsupported orbit element table shape: geojson-table');
  });
});

describe('orbit element helpers', () => {
  test('parseAlpha5CatalogNumber', () => {
    expect(parseAlpha5CatalogNumber('25544')).toBe(25544);
    expect(parseAlpha5CatalogNumber('    5')).toBe(5);
    expect(parseAlpha5CatalogNumber('A0057')).toBe(100057);
    expect(parseAlpha5CatalogNumber('H9999')).toBe(179999);
    expect(parseAlpha5CatalogNumber('J0000')).toBe(180000);
    expect(parseAlpha5CatalogNumber('P0000')).toBe(230000);
    expect(parseAlpha5CatalogNumber('Z9999')).toBe(339999);
    expect(() => parseAlpha5CatalogNumber('O0001')).toThrow('invalid catalog number');
    expect(() => parseAlpha5CatalogNumber('A057')).toThrow('invalid catalog number');
  });

  test('parseOMMEpoch', () => {
    expect(parseOMMEpoch('2026-11-23T21:54:38.454048')).toBe(
      Date.UTC(2026, 10, 23, 21, 54, 38, 454)
    );
    expect(parseOMMEpoch('2026-11-23T21:54:38Z')).toBe(Date.UTC(2026, 10, 23, 21, 54, 38));
    expect(parseOMMEpoch('2024-366T00:00:00.5')).toBe(Date.UTC(2024, 11, 31, 0, 0, 0, 500));
    expect(parseOMMEpoch('2024-366T00:00:00')).toBe(Date.parse('2024-12-31T00:00:00Z'));
    expect(parseOMMEpoch('2024-02-29T00:00:00')).toBe(Date.parse('2024-02-29T00:00:00Z'));
    expect(parseOMMEpoch('2016-12-31T23:59:60')).toBe(Date.parse('2017-01-01T00:00:00Z'));
  });

  test.each([
    '2026-02-31T00:00:00',
    '2026-366T00:00:00',
    '2026-02-29T00:00:00',
    '2026-13-01T00:00:00',
    '2026-000T00:00:00',
    '1900-02-29T00:00:00',
    '2026-11-23T24:00:00',
    '2026-11-23T00:60:00',
    '2026-11-23T00:00:61'
  ])('rejects out-of-range OMM epoch %s', epoch => {
    expect(() => parseOMMEpoch(epoch)).toThrow(`invalid epoch "${epoch}"`);
  });

  test('preserves years 0000–0099 in OMM epochs', () => {
    const date = new Date(0);
    expect(parseOMMEpoch('0099-001T00:00:00')).toBe(date.setUTCFullYear(99, 0, 1));
    expect(parseOMMEpoch('0000-02-29T00:00:00')).toBe(date.setUTCFullYear(0, 1, 29));
  });
});
