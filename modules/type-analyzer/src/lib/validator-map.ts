// Forked from https://github.com/uber-web/type-analyzer under MIT license
// Copyright (c) 2017 Uber Technologies, Inc.

import {DATA_TYPES} from './constant';
import {
  isBoolean,
  isDateObject,
  isString,
  isArray,
  isObject,
  isGeographic,
  // whichFormatDateTime,
  // whichFormatDate,
  // whichFormatTime,
  buildRegexCheck
} from './utils';

const VALIDATOR_MAP = {};

// geometry
VALIDATOR_MAP[DATA_TYPES.GEOMETRY] = isGeographic;
VALIDATOR_MAP[DATA_TYPES.GEOMETRY_FROM_STRING] = buildRegexCheck('isStringGeometry');
VALIDATOR_MAP[DATA_TYPES.PAIR_GEOMETRY_FROM_STRING] = buildRegexCheck('isPairwisePointGeometry');

// basic boolean: true/false, 0/1
VALIDATOR_MAP[DATA_TYPES.BOOLEAN] = isBoolean;
VALIDATOR_MAP[DATA_TYPES.DATE_OBJECT] = isDateObject;

// prefix/postfix rules: '$30.00', '10.05%'
VALIDATOR_MAP[DATA_TYPES.CURRENCY] = buildRegexCheck('isCurrency');
VALIDATOR_MAP[DATA_TYPES.PERCENT] = buildRegexCheck('isPercentage');

// basic
VALIDATOR_MAP[DATA_TYPES.ARRAY] = isArray;
VALIDATOR_MAP[DATA_TYPES.OBJECT] = isObject;
// times
VALIDATOR_MAP[DATA_TYPES.DATETIME] = buildRegexCheck('isDateTime');

VALIDATOR_MAP[DATA_TYPES.DATE] = buildRegexCheck('isDate');
VALIDATOR_MAP[DATA_TYPES.TIME] = buildRegexCheck('isTime');

// VALIDATOR_MAP[DATA_TYPES.DATETIME] = whichFormatDateTime;
//
// VALIDATOR_MAP[DATA_TYPES.DATE] = whichFormatDate;
// VALIDATOR_MAP[DATA_TYPES.TIME] = whichFormatTime;

// numbers:
// 1, 2, 3, +40, 15,121
const intRegexCheck = buildRegexCheck('isInt');
function isInt(value) {
  if (intRegexCheck(value)) {
    const asNum = parseInt(value.toString().replace(/(\+|,)/g, ''), 10);
    return asNum > Number.MIN_SAFE_INTEGER && asNum < Number.MAX_SAFE_INTEGER;
  }

  return false;
}
VALIDATOR_MAP[DATA_TYPES.INT] = isInt;

// 1.1, 2.2, 3.3
const floatRegexCheck = buildRegexCheck('isFloat');
function isFloat(value) {
  return floatRegexCheck(value) || isInt(value);
}
VALIDATOR_MAP[DATA_TYPES.FLOAT] = isFloat;

// 1, 2.2, 3.456789e+0
VALIDATOR_MAP[DATA_TYPES.NUMBER] = function isNumeric(row) {
  return !isNaN(row) || isInt(row) || isFloat(row);
};

// strings: '94101-10', 'San Francisco', 'Name'
VALIDATOR_MAP[DATA_TYPES.ZIPCODE] = buildRegexCheck('isZipCode');
VALIDATOR_MAP[DATA_TYPES.STRING] = isString;

export {VALIDATOR_MAP};
