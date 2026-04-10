// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright (c) 2015 Matthew Holt

// This is a fork of papaparse v5.0.0-beta.0 under MIT license
// https://github.com/mholt/PapaParse

import {Papa} from './papa-constants';

export type CSVWriterConfig = {
  chunk?: boolean;
  chunkSize?: number | null;
  preview?: number;
  newline?: string;
  comments?: boolean;
  skipEmptyLines?: boolean | 'greedy';
  delimitersToGuess?: string[];
  quotes?: string[] | boolean;
  quoteChar?: string;
  escapeChar?: string;
  delimiter?: string;
  // Convert numbers and boolean values in rows from strings
  fastMode?: boolean;

  dynamicTyping?: boolean | {};
  dynamicTypingFunction?: Function;
  step?: Function;
  transform?: Function;

  header?: any;
  columns?: any;
};

// eslint-disable-next-line complexity, max-statements
export function JsonToCsv(_input, _config: CSVWriterConfig = {}) {
  // Default configuration

  /** whether to surround every datum with quotes */
  let _quotes: string[] | boolean = false;

  /** whether to write headers */
  let _writeHeader = true;

  /** delimiting character(s) */
  let _delimiter = ',';

  /** newline character(s) */
  let _newline = '\r\n';

  /** quote character */
  let _quoteChar = '"';

  /** escaped quote character, either "" or <config.escapeChar>" */
  let _escapedQuote = _quoteChar + _quoteChar;

  /** whether to skip empty lines */
  let _skipEmptyLines: 'greedy' | boolean = false;

  /** the columns (keys) we expect when we unparse objects */
  let _columns: any = null;

  unpackConfig();

  const quoteCharRegex = new RegExp(escapeRegExp(_quoteChar), 'g');

  if (typeof _input === 'string') _input = JSON.parse(_input);

  if (Array.isArray(_input)) {
    if (!_input.length || Array.isArray(_input[0])) {
      return serialize(null, _input, _skipEmptyLines);
    } else if (typeof _input[0] === 'object') {
      return serialize(_columns || Object.keys(_input[0]), _input, _skipEmptyLines);
    }
  } else if (typeof _input === 'object') {
    if (typeof _input.data === 'string') {
      _input.data = JSON.parse(_input.data);
    }

    if (Array.isArray(_input.data)) {
      if (!_input.fields) {
        _input.fields = _input.meta && _input.meta.fields;
      }

      if (!_input.fields) {
        _input.fields = Array.isArray(_input.data[0]) ? _input.fields : Object.keys(_input.data[0]);
      }

      if (!Array.isArray(_input.data[0]) && typeof _input.data[0] !== 'object') {
        _input.data = [_input.data]; // handles input like [1,2,3] or ['asdf']
      }
    }

    return serialize(_input.fields || [], _input.data || [], _skipEmptyLines);
  }

  // Default (any valid paths should return before this)
  throw new Error('Unable to serialize unrecognized input');

  // eslint-disable-next-line complexity
  function unpackConfig() {
    if (typeof _config !== 'object') return;

    if (
      typeof _config.delimiter === 'string' &&
      !Papa.BAD_DELIMITERS.filter(function (value) {
        return _config.delimiter?.indexOf(value) !== -1;
      }).length
    ) {
      _delimiter = _config.delimiter;
    }

    if (typeof _config.quotes === 'boolean' || Array.isArray(_config.quotes))
      _quotes = _config.quotes;

    if (typeof _config.skipEmptyLines === 'boolean' || _config.skipEmptyLines === 'greedy')
      _skipEmptyLines = _config.skipEmptyLines;

    if (typeof _config.newline === 'string') _newline = _config.newline;

    if (typeof _config.quoteChar === 'string') _quoteChar = _config.quoteChar;

    if (typeof _config.header === 'boolean') _writeHeader = _config.header;

    if (Array.isArray(_config.columns)) {
      if (_config.columns.length === 0) throw new Error('Option columns is empty');

      _columns = _config.columns;
    }

    if (_config.escapeChar !== undefined) {
      _escapedQuote = _config.escapeChar + _quoteChar;
    }
  }

  /** The double for loop that iterates the data and writes out a CSV string including header row */
  // eslint-disable-next-line complexity, max-statements
  function serialize(fields, data, skipEmptyLines) {
    let csv = '';

    if (typeof fields === 'string') fields = JSON.parse(fields);
    if (typeof data === 'string') data = JSON.parse(data);

    const hasHeader = Array.isArray(fields) && fields.length > 0;
    const dataKeyedByField = !Array.isArray(data[0]);

    // If there a header row, write it first
    if (hasHeader && _writeHeader) {
      for (let i = 0; i < fields.length; i++) {
        if (i > 0) csv += _delimiter;
        csv += safe(fields[i], i);
      }
      if (data.length > 0) csv += _newline;
    }

    // Then write out the data
    for (let row = 0; row < data.length; row++) {
      const maxCol = hasHeader ? fields.length : data[row].length;

      let emptyLine = false;
      const nullLine = hasHeader ? Object.keys(data[row]).length === 0 : data[row].length === 0;
      if (skipEmptyLines && !hasHeader) {
        emptyLine =
          skipEmptyLines === 'greedy'
            ? data[row].join('').trim() === ''
            : data[row].length === 1 && data[row][0].length === 0;
      }
      if (skipEmptyLines === 'greedy' && hasHeader) {
        const line: string[] = [];
        for (let c = 0; c < maxCol; c++) {
          const cx = dataKeyedByField ? fields[c] : c;
          line.push(data[row][cx]);
        }
        emptyLine = line.join('').trim() === '';
      }
      if (!emptyLine) {
        for (let col = 0; col < maxCol; col++) {
          if (col > 0 && !nullLine) csv += _delimiter;
          const colIdx = hasHeader && dataKeyedByField ? fields[col] : col;
          csv += safe(data[row][colIdx], col);
        }
        if (row < data.length - 1 && (!skipEmptyLines || (maxCol > 0 && !nullLine))) {
          csv += _newline;
        }
      }
    }
    return csv;
  }

  /** Encloses a value around quotes if needed (makes a value safe for CSV insertion) */
  // eslint-disable-next-line complexity
  function safe(str, col) {
    if (typeof str === 'undefined' || str === null) return '';

    if (str.constructor === Date) return JSON.stringify(str).slice(1, 25);

    str = str.toString().replace(quoteCharRegex, _escapedQuote);

    const needsQuotes =
      (typeof _quotes === 'boolean' && _quotes) ||
      (Array.isArray(_quotes) && _quotes[col]) ||
      hasAny(str, Papa.BAD_DELIMITERS) ||
      str.indexOf(_delimiter) > -1 ||
      str.charAt(0) === ' ' ||
      str.charAt(str.length - 1) === ' ';

    return needsQuotes ? _quoteChar + str + _quoteChar : str;
  }

  function hasAny(str, substrings) {
    for (let i = 0; i < substrings.length; i++) if (str.indexOf(substrings[i]) > -1) return true;
    return false;
  }
}

/** https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
