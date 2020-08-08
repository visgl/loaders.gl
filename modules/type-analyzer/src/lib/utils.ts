// Forked from https://github.com/uber-web/type-analyzer under MIT license
// Copyright (c) 2017 Uber Technologies, Inc.

import {DATA_TYPES, NULL, BOOLEAN_TRUE_VALUES, BOOLEAN_FALSE_VALUES} from './constant';

import {
  ALL_TIME_FORMAT_REGEX,
  TIME_FORMAT_REGEX_MAP,
  DATE_FORMAT_REGEX,
  DATE_FORMAT_REGEX_MAP,
  ALL_DATE_TIME_REGEX,
  DATE_TIME_MAP
} from './time-regex';

import * as RegexList from './regex-list';

/**
 * Generate a function to discover which time format a value is
 * @param formatRegex - the filter to be checked and processed
 * @param {Object} regexMap - Map between regex and associated format
 * @return the format checker function
 */
function whichFormatGenerator(
  formatRegex: RegExp,
  regexMap: Record<string, RegExp>
): (value: string) => RegExp | boolean {
  return function whichFormat(value: string): RegExp | false {
    if (formatRegex.test(value)) {
      const regexes = Object.keys(regexMap);
      for (let i = 0; i < regexes.length; i++) {
        const regex = regexes[i];
        const format = regexMap[regex];
        const newRegex = new RegExp(regex);
        if (newRegex.test(value)) {
          return format;
        }
      }
    }
    return false;
  };
}

export const whichFormatTime = whichFormatGenerator(ALL_TIME_FORMAT_REGEX, TIME_FORMAT_REGEX_MAP);

export const whichFormatDate = whichFormatGenerator(DATE_FORMAT_REGEX, DATE_FORMAT_REGEX_MAP);

export const whichFormatDateTime = whichFormatGenerator(ALL_DATE_TIME_REGEX, DATE_TIME_MAP);

// is a json string
function tryParseJsonString(str: string): unknown {
  let parsed;
  try {
    parsed = JSON.parse(str);
  } catch (e) {
    return false;
  }
  return parsed;
}

export function isString(value: unknown): boolean {
  return typeof value === 'string';
}

export function isObject(value: unknown): boolean {
  return value === Object(value) && typeof value !== 'function' && !Array.isArray(value);
}

function isObjectString(str: unknown): boolean {
  if (typeof str !== 'string') {
    // !isString(str))
    return false;
  }
  if (!RegexList.isObject.test(str)) {
    return false;
  }
  const parsed = tryParseJsonString(str);
  return Boolean(parsed && isObject(parsed));
}

function isArray(value: unknown): boolean {
  return Array.isArray(value);
}

function isArrayString(str: unknown): boolean {
  if (typeof str !== 'string') {
    // !isString(str))
    return false;
  }
  if (!RegexList.isArray.test(str)) {
    return false;
  }
  const parsed = tryParseJsonString(str);
  return Boolean(parsed && isArray(parsed));
}

export function buildRegexCheck(regexId) {
  return function check(value) {
    return RegexList[regexId].test(value.toString());
  };
}

export function detectTimeFormat(value, type) {
  switch (type) {
    case DATA_TYPES.DATETIME:
      return whichFormatDateTime(value);
    case DATA_TYPES.DATE:
    default:
      return whichFormatDate(value);
    case DATA_TYPES.TIME:
      return whichFormatTime(value);
  }
}

export function findFirstNonNullValue(data, column) {
  for (let i = 0; i < data.length; i++) {
    if (data[i][column] !== null && data[i][column] !== NULL) {
      return data[i][column];
    }
  }
  return null;
}

export function isBoolean(value: unknown): boolean {
  return BOOLEAN_TRUE_VALUES.concat(BOOLEAN_FALSE_VALUES).indexOf(String(value).toLowerCase()) > -1;
}

export function isGeographic(value: unknown): boolean {
  return Boolean(
    value &&
      typeof value === 'object' &&
      value.hasOwnProperty('type') &&
      value.hasOwnProperty('coordinates')
  );
}

// string types

// export isString,

function _isArray(value) {
  return Boolean(isArray(value) || isArrayString(value));
}

// TODO - this renaming is hacky
export {_isArray as isArray};

export function isDateObject(value: unknown): boolean {
  // Note: invalid Dates return true as well as valid Dates.
  return value instanceof Date;
}

export function _isObject(value) {
  return Boolean(isObject(value) || isObjectString(value));
}
