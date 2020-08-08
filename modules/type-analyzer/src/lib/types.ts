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
