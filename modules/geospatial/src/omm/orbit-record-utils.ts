// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderOptions} from '@loaders.gl/core/loader-utils';

/** Options that control what a parser does with an invalid element set. */
export type OrbitRecordErrorOptions = {
  /** When `true`, skip an invalid element set and log a warning. When `false`, throw. */
  skipInvalidRecords?: boolean;
  /** Logger that receives the warnings. `console.warn` is used when no logger is supplied. */
  log?: NonNullable<LoaderOptions['core']>['log'];
};

/**
 * Error for one invalid field. The parser adds the location (record or line) to the message.
 */
export class OrbitFieldError extends Error {
  /** CCSDS OMM keyword of the invalid field, when the error concerns one field. */
  readonly keyword?: string;

  /**
   * Creates an error for one invalid field.
   *
   * @param message - Description of the problem.
   * @param keyword - CCSDS OMM keyword of the invalid field.
   */
  constructor(message: string, keyword?: string) {
    super(message);
    this.name = 'OrbitFieldError';
    this.keyword = keyword;
  }
}

/**
 * Throws an error for an invalid element set, or logs a warning when the options skip it.
 *
 * @param message - Full error message, with the loader name and the location.
 * @param options - Options that select throw or skip.
 */
export function handleInvalidRecord(message: string, options: OrbitRecordErrorOptions): void {
  if (!options.skipInvalidRecords) {
    throw new Error(message);
  }
  const warning = `${message} (record skipped)`;
  const log = options.log;
  if (log && typeof log.warn === 'function') {
    log.warn(warning)();
  } else {
    // eslint-disable-next-line no-console
    console.warn(warning);
  }
}

/** First characters of Alpha-5 catalog numbers. `I` and `O` are not used. */
const ALPHA5_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Converts a five-character catalog number, in the numeric or the Alpha-5 form, to an integer.
 *
 * In the Alpha-5 form, the first character is a letter that replaces the two leading digits:
 * `A` is 10, `H` is 17, `J` is 18 (`I` is not used), `P` is 23 (`O` is not used) and `Z` is 33.
 * For example, `A0057` is 100057 and `Z9999` is 339999.
 *
 * @param text - Catalog number field, for example `25544`, ` 5544` or `A0057`.
 * @returns Catalog number as an integer.
 */
export function parseAlpha5CatalogNumber(text: string): number {
  const value = text.trim();
  const match = /^([A-HJ-NP-Z]?)(\d{1,5})$/.exec(value);
  if (!match || (match[1] && match[2].length !== 4)) {
    throw new OrbitFieldError(`invalid catalog number "${text}"`, 'NORAD_CAT_ID');
  }
  const [, letter, digits] = match;
  if (!letter) {
    return Number(digits);
  }
  return (ALPHA5_LETTERS.indexOf(letter) + 10) * 10000 + Number(digits);
}

/** Matches a CCSDS epoch in the calendar form or in the day-of-year form. */
const EPOCH_PATTERN =
  /^(\d{4})-(?:(\d{2})-(\d{2})|(\d{3}))T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(Z)?$/;

/**
 * Converts a CCSDS OMM epoch string to milliseconds since the Unix epoch.
 *
 * The function accepts the calendar form (`2026-11-23T21:54:38.454048`) and the day-of-year
 * form (`2026-327T21:54:38.454048`). A string without a zone suffix is read as UTC, because
 * OMM element sets for SGP4 use `TIME_SYSTEM = UTC`. The result is rounded to milliseconds.
 *
 * @param epoch - Epoch string, for example the `EPOCH` field of an `OMMRow`.
 * @returns Milliseconds since 1970-01-01T00:00:00Z.
 */
export function parseOMMEpoch(epoch: string): number {
  const match = EPOCH_PATTERN.exec(epoch.trim());
  if (!match) {
    throw new OrbitFieldError(`invalid epoch "${epoch}"`, 'EPOCH');
  }
  const [, year, month, day, dayOfYear, hours, minutes, seconds, fraction = ''] = match;
  const fractionMs = fraction ? Number(`0.${fraction}`) * 1000 : 0;
  const date = dayOfYear
    ? Date.UTC(Number(year), 0, Number(dayOfYear))
    : Date.UTC(Number(year), Number(month) - 1, Number(day));
  const time = Date.UTC(1970, 0, 1, Number(hours), Number(minutes), Number(seconds));
  if (
    Number(month || 1) < 1 ||
    Number(day || dayOfYear) < 1 ||
    Number(month || 1) > 12 ||
    Number(day || dayOfYear) > (dayOfYear ? 366 : 31) ||
    Number(hours) > 23 ||
    Number(minutes) > 59 ||
    Number(seconds) > 60
  ) {
    throw new OrbitFieldError(`invalid epoch "${epoch}"`, 'EPOCH');
  }
  return Math.round(date + time + fractionMs);
}
