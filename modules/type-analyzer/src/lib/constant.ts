// loaders.gl, MIT license
// Forked from https://github.com/uber-web/type-analyzer under MIT license
// Copyright (c) 2017 Uber Technologies, Inc.

export type DataTypes =
  // date time formats
  | 'DATE'
  | 'TIME'
  | 'DATETIME'

  // number formats
  | 'NUMBER'
  | 'INT'
  | 'FLOAT'
  | 'CURRENCY'
  | 'PERCENT'

  // string types:
  | 'STRING'
  | 'ZIPCODE'

  // boolean type
  | 'BOOLEAN'

  // geometry
  | 'GEOMETRY'
  | 'GEOMETRY_FROM_STRING'
  | 'PAIR_GEOMETRY_FROM_STRING'

  // object format
  | 'NONE'
  | 'ARRAY'
  | 'DATE_OBJECT'
  | 'OBJECT';

export type TypeCategories = 'GEOMETRY' | 'TIME' | 'DIMENSION' | 'MEASURE';

export const DATA_TYPES: Record<DataTypes, DataTypes> = {
  // date time formats
  DATE: 'DATE',
  TIME: 'TIME',
  DATETIME: 'DATETIME',

  // number formats
  NUMBER: 'NUMBER',
  INT: 'INT',
  FLOAT: 'FLOAT',
  CURRENCY: 'CURRENCY',
  PERCENT: 'PERCENT',

  // string types:
  STRING: 'STRING',
  ZIPCODE: 'ZIPCODE',

  // boolean type
  BOOLEAN: 'BOOLEAN',

  // geometry
  GEOMETRY: 'GEOMETRY',
  GEOMETRY_FROM_STRING: 'GEOMETRY_FROM_STRING',
  PAIR_GEOMETRY_FROM_STRING: 'PAIR_GEOMETRY_FROM_STRING',

  // object format
  NONE: 'NONE',
  ARRAY: 'ARRAY',
  DATE_OBJECT: 'DATE_OBJECT',
  OBJECT: 'OBJECT'
};

export const CATEGORIES: Record<TypeCategories, TypeCategories> = {
  GEOMETRY: 'GEOMETRY',
  TIME: 'TIME',
  DIMENSION: 'DIMENSION',
  MEASURE: 'MEASURE'
};

export const BOOLEAN_TRUE_VALUES = ['true', 'yes'];
export const BOOLEAN_FALSE_VALUES = ['false', 'no'];

// Common in databases like MySQL: https://dev.mysql.com/doc/refman/8.0/en/null-values.html
export const DB_NULL = '\\N';
export const NULL = 'NULL';

export const POSSIBLE_TYPES: Record<TypeCategories, DataTypes[]> = {
  GEOMETRY: ['GEOMETRY_FROM_STRING', 'PAIR_GEOMETRY_FROM_STRING', 'GEOMETRY'],

  TIME: ['DATETIME', 'DATE', 'TIME'],

  DIMENSION: ['STRING', 'BOOLEAN', 'ZIPCODE'],

  MEASURE: ['NUMBER', 'INT', 'FLOAT', 'CURRENCY', 'PERCENT']
};

export const TYPES_TO_CATEGORIES = Object.keys(POSSIBLE_TYPES).reduce(
  function generateTypeToCategoryMap(res, category) {
    POSSIBLE_TYPES[category].forEach(function loopAcrossTypes(type) {
      res[type] = category;
    });
    return res;
  },
  {}
);

// NOTE: the order of validator is important.
// the ancestor validator used to be the subset of next validator
// here's trying to determine a more accuraet data type of the column.
// later on, users still can override the data type.
// this will affect how we transform(aggregation), formating the data.
export const VALIDATORS: DataTypes[] = [
  // geometry
  'GEOMETRY',
  'GEOMETRY_FROM_STRING',
  'PAIR_GEOMETRY_FROM_STRING',

  // true/false, 0/1
  'BOOLEAN',
  'ARRAY',
  'DATE_OBJECT',
  'OBJECT',

  // prefix/postfix rules
  'CURRENCY',
  'PERCENT',

  // times
  'DATETIME',
  'DATE',
  'TIME',

  // numbers
  'INT',
  'FLOAT',
  'NUMBER',

  // strings
  'ZIPCODE',
  'STRING'
];

export const TIME_VALIDATORS: DataTypes[] = ['DATETIME', 'DATE', 'TIME'];
