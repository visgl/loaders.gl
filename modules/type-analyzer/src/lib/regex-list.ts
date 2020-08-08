// Forked from https://github.com/uber-web/type-analyzer under MIT license
// Copyright (c) 2017 Uber Technologies, Inc.

import {ALL_TIME_FORMAT_REGEX, DATE_FORMAT_REGEX, ALL_DATE_TIME_REGEX} from './time-regex';

// accepts: 10, 2.3, +4,000, -5,023.234, 2.3e+2, 4,234.56e-2, $23,203, 23.45%
export const isNumber = /^(\+|\-)?\$?[\d,]*\.?\d+((e|E)(\+|\-)\d+)?%?$/;

// accepts: 12, +123, -12,234
export const isInt = /^(\+|\-)?[\d,]+$/;

// accepts: 1.1234, -.1234, +2.34
export const isFloat = /^(\+|\-)?[\d,]*\.\d+?$/;

// accepts: $1 $0.12 $1.12 $1,000.12 $1,000.12
export const isCurrency = /(?=.)^\$(([1-9][0-9]{0,2}(,[0-9]{3})*)|0)?(\.[0-9]{1,2})?$/;

// accepts: 34%, -23.45%, +2,234.23%
export const isPercentage = /^(\+|\-)?[\d,]*\.?\d+%$/;

// accepts:
// US: 12345, 12345-1234
// China: 123456, 123456-12
// we can have more zipcode from different coyntries :
// http://www.regxlib.com/Search.aspx?k=zipcode&c=-1&m=-1&ps=20
export const isZipCode = /(^\d{5}$)|(^\d{5}-\d{4}$)|(^\d{6}$)|(^\d{6}-\d{2}$)/;

export const isTime = ALL_TIME_FORMAT_REGEX;

export const isDate = DATE_FORMAT_REGEX;

export const isDateTime = ALL_DATE_TIME_REGEX;

// accepts: WKT string types
// reference: https://en.wikipedia.org/wiki/Well-known_text
export const isStringGeometry =
  /^(POINT|LINESTRING|POLYGON|MULTIPOINT|MULTILINESTRING|MULTIPOLYGON)/;

export const isPairwisePointGeometry = /(\+|\-)?\d*\.\d*,( )?(\+|\-)?\d*\.\d*/;

// accepts: string start with { and end with }
export const isObject = /^{([\s\S]*)}$/;

// accepts: string start with [ and end with ]
export const isArray = /^\[([\s\S]*)\]$/;
