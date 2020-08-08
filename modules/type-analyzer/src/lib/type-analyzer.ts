// Forked from https://github.com/uber-web/type-analyzer under MIT license
// Copyright (c) 2017 Uber Technologies, Inc.

import {
  DATA_TYPES,
  CATEGORIES,
  TYPES_TO_CATEGORIES,
  NULL,
  DB_NULL,
  VALIDATORS,
  TIME_VALIDATORS
} from './constant';
import {VALIDATOR_MAP} from './validator-map';
import {findFirstNonNullValue, detectTimeFormat} from './utils';

const NUMBER_OF_ALLOWED_HITS = 3;

const VALIDATOR_CONSIDERS_EMPTY_STRING_NULL = {
  PAIR_GEOMETRY_FROM_STRING: true,
  GEOMETRY_FROM_STRING: true,
  NUMBER: true
};

const VALIDATOR_CONSIDERS_NAN_NULL = {
  INT: true,
  NUMBER: true,
  FLOAT: true
};

export type ColumnMetadata = {
  key: string;
  label: string;
  type: string;
  category: any;
  format: string;
  geoType?: string;
};

export type ColumnMetadataOptions = {
  ignoredDataTypes?: unknown[];
  keepUnknowns?: boolean;
};

/**
 * Generate metadata about columns in a dataset
 * @param data - data for which meta will be generated
 * @param analyzerRules - regexs describing column overrides
 * @param ignoredDataTypes - array of datatypes to ignore when validating
 * @return column metadata
 **/
export function computeColumnMetadata(
  data,
  analyzerRules,
  options?: ColumnMetadataOptions
): ColumnMetadata[] {
  options = options || {};
  const ignoredDataTypes = options.ignoredDataTypes || [];
  const maybePushUnknown = options?.keepUnknowns ? _pushIntoArr : _noop;
  const allValidators = VALIDATORS.filter(function filterValidators(validator) {
    // @ts-expect-error
    return this.indexOf(validator) < 0;
  }, ignoredDataTypes);

  if (!data || Object.keys(data).length === 0) {
    return [];
  }

  const _columns = Object.keys(data[0]);
  /* eslint-disable max-statements, complexity */
  return _columns.reduce(function iterator(result: ColumnMetadata[], columnName: string) {
    let format: string | boolean | RegExp = '';
    // First try to get the column from the rules
    let type = getTypeFromRules(analyzerRules, columnName);
    // ff it's not there then try to infer the type
    if (!type) {
      type = allValidators.find(buildValidatorFinder(data, columnName));
    }
    const category = _category(type);
    const colMeta: ColumnMetadata = {
      key: columnName,
      label: columnName,
      type: DATA_TYPES.STRING,
      category: category || CATEGORIES.DIMENSION,
      format: ''
    };

    // if theres still no type, potentially dump this column
    if (!type) {
      maybePushUnknown(result, colMeta);
      return result;
    }
    colMeta.type = type;

    // if its a time, detect and record the time
    if (type && TIME_VALIDATORS.indexOf(type) !== -1) {
      // Find the first non-null value.
      const sample = findFirstNonNullValue(data, columnName);
      if (sample === null) {
        maybePushUnknown(result, colMeta);
        return result;
      }
      format = detectTimeFormat(sample, type) as any;
    }
    colMeta.format = format as any;

    if (type === DATA_TYPES.GEOMETRY) {
      const geoSample = findFirstNonNullValue(data, columnName);
      if (geoSample === null) {
        maybePushUnknown(result, colMeta);
        return result;
      }
      colMeta.geoType = typeof geoSample.type === 'string' ? geoSample.type.toUpperCase() : null;
    }
    if (type === DATA_TYPES.GEOMETRY_FROM_STRING) {
      const geoStringSample = findFirstNonNullValue(data, columnName);
      if (geoStringSample === null) {
        maybePushUnknown(result, colMeta);
        return result;
      }
      colMeta.geoType = geoStringSample.split(' ')[0].toUpperCase();
    }
    if (type === DATA_TYPES.PAIR_GEOMETRY_FROM_STRING) {
      colMeta.geoType = 'POINT';
    }
    result.push(colMeta);
    return result;
  }, []);
}

function _category(colType) {
  return TYPES_TO_CATEGORIES[colType] || CATEGORIES.DIMENSION;
}

/**
 * Check if a given value is a null for a validator
 * @param value - value to be checked if null
 * @param validatorName - the name of the current validation function
 * @return whether or not the current value is null
 **/
function valueIsNullForValidator(value: string, validatorName: string): boolean {
  if (value === null || value === NULL || value === DB_NULL || typeof value === 'undefined') {
    return true;
  }

  if (Number.isNaN(value) && VALIDATOR_CONSIDERS_NAN_NULL[validatorName]) {
    return true;
  }

  if (value === '' && VALIDATOR_CONSIDERS_EMPTY_STRING_NULL[validatorName]) {
    return true;
  }

  return false;
}

function buildValidatorFinder(data, columnName) {
  return function findTypeFromValidators(validatorName) {
    // you get three strikes until we dont think you are this type
    const nonNullData = data.filter(function iterator(row) {
      const value = row[columnName];
      return !valueIsNullForValidator(value, validatorName);
    });

    const validator = VALIDATOR_MAP[validatorName];

    let strikes = Math.min(NUMBER_OF_ALLOWED_HITS, nonNullData.length);
    let hits = 0;
    nonNullData.some(function iterateAcrossData(row) {
      const isValueValid = Boolean(validator(row[columnName]));
      if (isValueValid) {
        hits++;
      } else {
        strikes--;
      }

      if (strikes <= 0) {
        return true;
      }
      return false;
    });

    return strikes > 0 && hits > 0;
  };
}

function getTypeFromRules(analyzerRules, columnName) {
  return (analyzerRules || []).reduce(function checkClmns(newType, rule) {
    if (newType) {
      return newType;
    }
    if (rule.name && rule.name === columnName) {
      return rule.dataType;
    }
    if (rule.regex && rule.regex.test(columnName)) {
      return rule.dataType;
    }
    return newType;
  }, false);
}

function _pushIntoArr(arr, item) {
  arr.push(item);
}

function _noop() {}
