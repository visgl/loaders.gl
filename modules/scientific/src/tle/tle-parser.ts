// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {OMMRow} from '../omm/omm-schema';
import {validateElements} from '../omm/omm-parser';
import {
  OrbitFieldError,
  handleInvalidRecord,
  parseAlpha5CatalogNumber,
  type OrbitRecordErrorOptions
} from '../omm/orbit-record-utils';

/** Options for TLE parsing. */
export type TLEParseOptions = OrbitRecordErrorOptions & {
  /** When `false`, the parser does not compare the modulo-10 checksums. Default `true`. */
  validateChecksum?: boolean;
};

/** Number of characters in a TLE element line. */
const TLE_LINE_LENGTH = 69;

/** Microseconds in 1e-8 day, the resolution of the TLE epoch field. */
const MICROSECONDS_PER_1E8_DAY = 864;

/** Microseconds in one day. */
const MICROSECONDS_PER_DAY = 86400e6;

/**
 * Parses TLE text in the two-line form or in the three-line form (a name line before each set).
 *
 * The parser accepts LF and CRLF line ends, blank lines, a `0 ` prefix on name lines and Alpha-5
 * catalog numbers. It returns rows with the CCSDS OMM keyword names (see `OMMRow`).
 *
 * @param text - TLE text.
 * @param options - Checksum and invalid-record options.
 * @returns One row for each valid element set.
 */
export function parseTLEText(text: string, options: TLEParseOptions = {}): OMMRow[] {
  const lines = text
    .replace(/^﻿/, '')
    .split(/\r\n|\r|\n/)
    .map((line, index) => ({text: line.trimEnd(), lineNumber: index + 1}))
    .filter(line => line.text.trim().length > 0);

  const rows: OMMRow[] = [];
  let name: {text: string; lineNumber: number} | null = null;

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const nextLine = lines[index + 1];

    if (isElementLine(line.text, '1')) {
      if (!nextLine || !isElementLine(nextLine.text, '2')) {
        handleInvalidRecord(
          `TLELoader: line ${line.lineNumber}: TLE line 1 is not followed by TLE line 2`,
          options
        );
        name = null;
        continue;
      }
      try {
        rows.push(convertTLEToOMMRow(line.text, nextLine.text, name?.text ?? null, options));
      } catch (error) {
        const lineNumber =
          error instanceof TLELineError && error.lineIndex === 2
            ? nextLine.lineNumber
            : line.lineNumber;
        handleInvalidRecord(`TLELoader: line ${lineNumber}: ${(error as Error).message}`, options);
      }
      name = null;
      index++;
      continue;
    }

    if (isElementLine(line.text, '2')) {
      handleInvalidRecord(
        `TLELoader: line ${line.lineNumber}: TLE line 2 has no TLE line 1 before it`,
        options
      );
      name = null;
      continue;
    }

    if (name) {
      handleInvalidRecord(
        `TLELoader: line ${name.lineNumber}: name line "${name.text.trim()}" is not followed by TLE line 1`,
        options
      );
    }
    name = line;
  }

  if (name) {
    handleInvalidRecord(
      `TLELoader: line ${name.lineNumber}: name line "${name.text.trim()}" is not followed by TLE line 1`,
      options
    );
  }
  return rows;
}

/** Error in one line of a TLE set. */
export class TLELineError extends OrbitFieldError {
  /** `1` or `2`: the TLE line that has the error. */
  readonly lineIndex: 1 | 2;

  /**
   * Creates an error for one line of a TLE set.
   *
   * @param lineIndex - `1` or `2`.
   * @param message - Description of the problem.
   */
  constructor(lineIndex: 1 | 2, message: string) {
    super(message);
    this.name = 'TLELineError';
    this.lineIndex = lineIndex;
  }
}

/**
 * Converts one TLE set to a row with the CCSDS OMM keyword names and units.
 *
 * @param line1 - TLE line 1.
 * @param line2 - TLE line 2.
 * @param name - Name line (line 0), or `null`.
 * @param options - Checksum option.
 * @returns Validated orbit mean-element row.
 */
export function convertTLEToOMMRow(
  line1: string,
  line2: string,
  name: string | null = null,
  options: Pick<TLEParseOptions, 'validateChecksum'> = {}
): OMMRow {
  const first = line1.trimEnd();
  const second = line2.trimEnd();
  checkLine(first, 1, options.validateChecksum !== false);
  checkLine(second, 2, options.validateChecksum !== false);

  const catalogNumber = readField(1, () => parseAlpha5CatalogNumber(first.slice(2, 7)));
  const catalogNumber2 = readField(2, () => parseAlpha5CatalogNumber(second.slice(2, 7)));
  if (catalogNumber !== catalogNumber2) {
    throw new TLELineError(
      2,
      `catalog number ${catalogNumber2} on TLE line 2 does not agree with ${catalogNumber} on TLE line 1`
    );
  }

  const row: OMMRow = {
    OBJECT_NAME: name === null ? null : name.trim().replace(/^0 +/, '') || null,
    OBJECT_ID: readField(1, () => readInternationalDesignator(first.slice(9, 17))),
    NORAD_CAT_ID: catalogNumber,
    EPOCH: readField(1, () => readEpoch(first.slice(18, 32))),
    MEAN_MOTION: readField(2, () => readDecimal(second.slice(52, 63), 'MEAN_MOTION')),
    ECCENTRICITY: readField(2, () => readImpliedDecimal(second.slice(26, 33), 'ECCENTRICITY')),
    INCLINATION: readField(2, () => readDecimal(second.slice(8, 16), 'INCLINATION')),
    RA_OF_ASC_NODE: readField(2, () => readDecimal(second.slice(17, 25), 'RA_OF_ASC_NODE')),
    ARG_OF_PERICENTER: readField(2, () => readDecimal(second.slice(34, 42), 'ARG_OF_PERICENTER')),
    MEAN_ANOMALY: readField(2, () => readDecimal(second.slice(43, 51), 'MEAN_ANOMALY')),
    EPHEMERIS_TYPE: readField(1, () => readInteger(first.slice(62, 63), 'EPHEMERIS_TYPE', 0)),
    CLASSIFICATION_TYPE: first[7].trim() || null,
    ELEMENT_SET_NO: readField(1, () => readInteger(first.slice(64, 68), 'ELEMENT_SET_NO', null)),
    REV_AT_EPOCH: readField(2, () => readInteger(second.slice(63, 68), 'REV_AT_EPOCH', null)),
    BSTAR: readField(1, () => readExponent(first.slice(53, 61), 'BSTAR')),
    MEAN_MOTION_DOT: readField(1, () => readDecimal(first.slice(33, 43), 'MEAN_MOTION_DOT')),
    MEAN_MOTION_DDOT: readField(1, () => readExponent(first.slice(44, 52), 'MEAN_MOTION_DDOT'))
  };
  readField(2, () => validateElements(row));
  return row;
}

/**
 * Computes the modulo-10 checksum of a TLE line: the sum of the digits in columns 1 to 68,
 * plus 1 for each minus sign.
 *
 * @param line - TLE line 1 or line 2.
 * @returns Checksum digit, 0 to 9.
 */
export function computeTLEChecksum(line: string): number {
  let sum = 0;
  for (let index = 0; index < TLE_LINE_LENGTH - 1 && index < line.length; index++) {
    const character = line[index];
    if (character >= '0' && character <= '9') {
      sum += character.charCodeAt(0) - 48;
    } else if (character === '-') {
      sum += 1;
    }
  }
  return sum % 10;
}

/**
 * Returns `true` when a line starts with the line number and a space, for example `1 `.
 *
 * @param line - Text line.
 * @param lineNumber - `'1'` or `'2'`.
 */
function isElementLine(line: string, lineNumber: '1' | '2'): boolean {
  return line.startsWith(`${lineNumber} `);
}

/**
 * Checks the length and, optionally, the checksum of a TLE line.
 *
 * @param line - TLE line without trailing white space.
 * @param lineIndex - `1` or `2`.
 * @param validateChecksum - `true` to compare the checksum.
 */
function checkLine(line: string, lineIndex: 1 | 2, validateChecksum: boolean): void {
  if (line.length !== TLE_LINE_LENGTH) {
    throw new TLELineError(
      lineIndex,
      `TLE line ${lineIndex} must have ${TLE_LINE_LENGTH} characters, found ${line.length}`
    );
  }
  if (validateChecksum) {
    const expected = computeTLEChecksum(line);
    const found = line[TLE_LINE_LENGTH - 1];
    if (found !== String(expected)) {
      throw new TLELineError(
        lineIndex,
        `checksum error on TLE line ${lineIndex}: found "${found}", computed ${expected}`
      );
    }
  }
}

/**
 * Runs a field reader and adds the TLE line index to its error.
 *
 * @param lineIndex - `1` or `2`.
 * @param read - Field reader.
 * @returns The value of the field.
 */
function readField<T>(lineIndex: 1 | 2, read: () => T): T {
  try {
    return read();
  } catch (error) {
    if (error instanceof TLELineError) {
      throw error;
    }
    throw new TLELineError(lineIndex, (error as Error).message);
  }
}

/**
 * Reads a decimal field, for example ` 51.6322` or `-.00002182`.
 *
 * @param text - Field text.
 * @param keyword - CCSDS OMM keyword, for the error message.
 */
function readDecimal(text: string, keyword: string): number {
  const value = text.trim();
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(value)) {
    throw new OrbitFieldError(`${keyword}: invalid number "${text}"`, keyword);
  }
  return Number(value);
}

/**
 * Reads a field with an implied leading decimal point, for example `0007379` (0.0007379).
 *
 * @param text - Field text.
 * @param keyword - CCSDS OMM keyword, for the error message.
 */
function readImpliedDecimal(text: string, keyword: string): number {
  const value = text.trim();
  if (!/^\d+$/.test(value)) {
    throw new OrbitFieldError(`${keyword}: invalid number "${text}"`, keyword);
  }
  return Number(`0.${value}`);
}

/**
 * Reads a field with an implied leading decimal point and a power-of-ten exponent, for example
 * ` 10921-3` (0.10921e-3) or `-11606-4` (-0.11606e-4).
 *
 * @param text - Field text (8 characters).
 * @param keyword - CCSDS OMM keyword, for the error message.
 */
function readExponent(text: string, keyword: string): number {
  const match = /^\s*([+-]?)\s*(\d{1,5})\s*([+-]?)(\d)\s*$/.exec(text);
  if (!match) {
    throw new OrbitFieldError(`${keyword}: invalid number "${text}"`, keyword);
  }
  const [, sign, digits, exponentSign, exponent] = match;
  // Parse the decimal text, so that the result is the double nearest to the written value.
  const value = Number(`${sign}0.${digits}e${exponentSign || '+'}${exponent}`);
  return value === 0 ? 0 : value;
}

/**
 * Reads an integer field.
 *
 * @param text - Field text.
 * @param keyword - CCSDS OMM keyword, for the error message.
 * @param blankValue - Value for a blank field.
 */
function readInteger(text: string, keyword: string, blankValue: number | null): number | null {
  const value = text.trim();
  if (value === '') {
    return blankValue;
  }
  if (!/^\d+$/.test(value)) {
    throw new OrbitFieldError(`${keyword}: invalid integer "${text}"`, keyword);
  }
  return Number(value);
}

/**
 * Converts the TLE international designator (`98067A`) to the OMM form (`1998-067A`).
 *
 * @param text - Columns 10 to 17 of TLE line 1.
 * @returns The designator, or `null` when the field is blank.
 */
function readInternationalDesignator(text: string): string | null {
  const value = text.trim();
  if (value === '') {
    return null;
  }
  const match = /^(\d{2})(\d{3})([A-Z]{1,3})$/.exec(value);
  if (!match) {
    throw new OrbitFieldError(`invalid international designator "${text}"`, 'OBJECT_ID');
  }
  const [, year, launchNumber, piece] = match;
  return `${getFullYear(Number(year))}-${launchNumber}${piece}`;
}

/**
 * Converts the TLE epoch (`YYDDD.DDDDDDDD`) to an ISO 8601 UTC string with microseconds.
 * Two-digit years 57 to 99 are 1957 to 1999, and 00 to 56 are 2000 to 2056.
 *
 * @param text - Columns 19 to 32 of TLE line 1.
 * @returns Epoch, for example `2026-11-23T21:54:38.454048`.
 */
function readEpoch(text: string): string {
  const match = /^(\d{2})(\d{3})\.(\d+)$/.exec(text.trim());
  if (!match) {
    throw new OrbitFieldError(`invalid epoch "${text}"`, 'EPOCH');
  }
  const [, year, day, fraction] = match;
  const dayOfYear = Number(day);
  const fullYear = getFullYear(Number(year));
  const daysInYear =
    Date.UTC(fullYear + 1, 0, 1) - Date.UTC(fullYear, 0, 1) === 366 * 864e5 ? 366 : 365;
  if (dayOfYear < 1 || dayOfYear > daysInYear) {
    throw new OrbitFieldError(`invalid epoch day of year ${dayOfYear}`, 'EPOCH');
  }

  // Integer arithmetic: 1e-8 day is exactly 864 microseconds.
  const fractionDigits = fraction.padEnd(8, '0');
  const microseconds =
    fractionDigits.length === 8
      ? Number(fractionDigits) * MICROSECONDS_PER_1E8_DAY
      : Math.round(Number(`0.${fraction}`) * MICROSECONDS_PER_DAY);

  const dateMs = Date.UTC(fullYear, 0, dayOfYear) + Math.floor(microseconds / 1000);
  const date = new Date(dateMs).toISOString().slice(0, 19);
  const microsecondText = String(microseconds % 1e6).padStart(6, '0');
  return `${date}.${microsecondText}`;
}

/**
 * Converts a two-digit year with the pivot year 57.
 *
 * @param year - Two-digit year.
 */
function getFullYear(year: number): number {
  return year < 57 ? 2000 + year : 1900 + year;
}
