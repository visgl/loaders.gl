// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright (c) 2015 Matthew Holt

// This is a fork of papaparse v5.0.0-beta.0 under MIT license
// https://github.com/mholt/PapaParse

/* eslint-disable no-continue, max-depth */

import {Papa} from './papa-constants';

export type CSVParserConfig = {
  chunk?: boolean;
  chunkSize?: number | null;
  preview?: number;
  newline?: string;
  comments?: boolean | string;
  skipEmptyLines?: boolean | 'greedy';
  delimitersToGuess?: string[];
  quotes?: string[] | boolean;
  quoteChar?: string;
  escapeChar?: string;
  delimiter?: string | Function;
  // Convert numbers and boolean values in rows from strings
  fastMode?: boolean;

  dynamicTyping?: boolean | {};
  dynamicTypingFunction?: Function;
  step?: Function;
  transform?: Function;
  complete?: Function;
};

// const defaultConfig: Required<CSVParserConfig> = {
//   dynamicTyping: false,
//   dynamicTypingFunction: undefined!,
//   transform: false
// };

export function CsvToJson(_input, _config: CSVParserConfig = {}, Streamer: any = StringStreamer) {
  const streamer = new Streamer(_config);

  return streamer.stream(_input);
}

/** ChunkStreamer is the base prototype for various streamer implementations. */
export class ChunkStreamer {
  _handle;
  _config;

  _finished = false;
  _completed = false;
  _input = null;
  _baseIndex = 0;
  _partialLine = '';
  _rowCount = 0;
  _start = 0;
  isFirstChunk = true;
  _completeResults = {
    data: [],
    errors: [],
    meta: {}
  };

  constructor(config: CSVParserConfig) {
    // Deep-copy the config so we can edit it
    const configCopy = {...config};
    if (configCopy.dynamicTypingFunction) {
      configCopy.dynamicTyping = {};
    }
    // @ts-expect-error
    configCopy.chunkSize = parseInt(configCopy.chunkSize); // parseInt VERY important so we don't concatenate strings!
    if (!config.step && !config.chunk) {
      configCopy.chunkSize = null; // disable Range header if not streaming; bad values break IIS - see issue #196
    }
    this._handle = new ParserHandle(configCopy);
    this._handle.streamer = this;
    this._config = configCopy; // persist the copy to the caller
  }

  // eslint-disable-next-line complexity, max-statements
  parseChunk(chunk, isFakeChunk?: boolean) {
    // First chunk pre-processing
    if (this.isFirstChunk && isFunction(this._config.beforeFirstChunk)) {
      const modifiedChunk = this._config.beforeFirstChunk(chunk);
      if (modifiedChunk !== undefined) chunk = modifiedChunk;
    }
    this.isFirstChunk = false;

    // Rejoin the line we likely just split in two by chunking the file
    const aggregate = this._partialLine + chunk;
    this._partialLine = '';

    let results = this._handle.parse(aggregate, this._baseIndex, !this._finished);

    if (this._handle.paused() || this._handle.aborted()) return;

    const lastIndex = results.meta.cursor;

    if (!this._finished) {
      this._partialLine = aggregate.substring(lastIndex - this._baseIndex);
      this._baseIndex = lastIndex;
    }

    if (results && results.data) this._rowCount += results.data.length;

    const finishedIncludingPreview =
      this._finished || (this._config.preview && this._rowCount >= this._config.preview);

    if (isFunction(this._config.chunk) && !isFakeChunk) {
      this._config.chunk(results, this._handle);
      if (this._handle.paused() || this._handle.aborted()) return;
      results = undefined;
      // @ts-expect-error
      this._completeResults = undefined;
    }

    if (!this._config.step && !this._config.chunk) {
      this._completeResults.data = this._completeResults.data.concat(results.data);
      this._completeResults.errors = this._completeResults.errors.concat(results.errors);
      this._completeResults.meta = results.meta;
    }

    if (
      !this._completed &&
      finishedIncludingPreview &&
      isFunction(this._config.complete) &&
      (!results || !results.meta.aborted)
    ) {
      this._config.complete(this._completeResults, this._input);
      this._completed = true;
    }

    // if (!finishedIncludingPreview && (!results || !results.meta.paused)) this._nextChunk();

    // eslint-disable-next-line consistent-return
    return results;
  }

  _sendError(error) {
    if (isFunction(this._config.error)) this._config.error(error);
  }
}

class StringStreamer extends ChunkStreamer {
  remaining;

  constructor(config = {}) {
    super(config);
  }

  stream(s) {
    this.remaining = s;
    return this._nextChunk();
  }

  _nextChunk() {
    if (this._finished) return;
    const size = this._config.chunkSize;
    const chunk = size ? this.remaining.substr(0, size) : this.remaining;
    this.remaining = size ? this.remaining.substr(size) : '';
    this._finished = !this.remaining;
    // eslint-disable-next-line consistent-return
    return this.parseChunk(chunk);
  }
}

const FLOAT = /^\s*-?(\d*\.?\d+|\d+\.?\d*)(e[-+]?\d+)?\s*$/i;
const ISO_DATE =
  /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/;

// Use one ParserHandle per entire CSV file or string
export class ParserHandle {
  _config;

  /** Number of times step was called (number of rows parsed) */
  _stepCounter = 0;
  /** Number of rows that have been parsed so far */
  _rowCounter = 0;
  /** The input being parsed */
  _input;
  /** The core parser being used */
  _parser;
  /** Whether we are paused or not */
  _paused = false;
  /** Whether the parser has aborted or not */
  _aborted = false;
  /** Temporary state between delimiter detection and processing results */
  _delimiterError: boolean = false;
  /** Fields are from the header row of the input, if there is one */
  _fields: string[] = [];
  /** The last results returned from the parser */
  _results: {
    data: any[][] | Record<string, any>[];
    errors: any[];
    meta: Record<string, any>;
  } = {
    data: [],
    errors: [],
    meta: {}
  };

  constructor(_config: CSVParserConfig) {
    // One goal is to minimize the use of regular expressions...

    if (isFunction(_config.step)) {
      const userStep = _config.step;
      _config.step = (results) => {
        this._results = results;

        if (this.needsHeaderRow()) {
          this.processResults();
        }
        // only call user's step function after header row
        else {
          this.processResults();

          // It's possbile that this line was empty and there's no row here after all
          if (!this._results.data || this._results.data.length === 0) return;

          this._stepCounter += results.data.length;
          if (_config.preview && this._stepCounter > _config.preview) {
            this._parser.abort();
          } else {
            userStep(this._results, this);
          }
        }
      };
    }
    this._config = _config;
  }

  /**
   * Parses input. Most users won't need, and shouldn't mess with, the baseIndex
   * and ignoreLastRow parameters. They are used by streamers (wrapper functions)
   * when an input comes in multiple chunks, like from a file.
   */
  parse(input, baseIndex, ignoreLastRow) {
    const quoteChar = this._config.quoteChar || '"';
    if (!this._config.newline) this._config.newline = guessLineEndings(input, quoteChar);

    this._delimiterError = false;
    if (!this._config.delimiter) {
      const delimGuess = this.guessDelimiter(
        input,
        this._config.newline,
        this._config.skipEmptyLines,
        this._config.comments,
        this._config.delimitersToGuess
      );
      if (delimGuess.successful) {
        this._config.delimiter = delimGuess.bestDelimiter;
      } else {
        this._delimiterError = true; // add error after parsing (otherwise it would be overwritten)
        this._config.delimiter = Papa.DefaultDelimiter;
      }
      this._results.meta.delimiter = this._config.delimiter;
    } else if (isFunction(this._config.delimiter)) {
      this._config.delimiter = this._config.delimiter(input);
      this._results.meta.delimiter = this._config.delimiter;
    }

    const parserConfig = copy(this._config);
    if (this._config.preview && this._config.header) parserConfig.preview++; // to compensate for header row

    this._input = input;
    this._parser = new Parser(parserConfig);
    this._results = this._parser.parse(this._input, baseIndex, ignoreLastRow);
    this.processResults();
    return this._paused ? {meta: {paused: true}} : this._results || {meta: {paused: false}};
  }

  paused() {
    return this._paused;
  }

  pause() {
    this._paused = true;
    this._parser.abort();
    this._input = this._input.substr(this._parser.getCharIndex());
  }

  resume() {
    this._paused = false;
    // @ts-expect-error
    this.streamer.parseChunk(this._input, true);
  }

  aborted() {
    return this._aborted;
  }

  abort() {
    this._aborted = true;
    this._parser.abort();
    this._results.meta.aborted = true;
    if (isFunction(this._config.complete)) {
      this._config.complete(this._results);
    }
    this._input = '';
  }

  testEmptyLine(s) {
    return this._config.skipEmptyLines === 'greedy'
      ? s.join('').trim() === ''
      : s.length === 1 && s[0].length === 0;
  }

  processResults() {
    if (this._results && this._delimiterError) {
      this.addError(
        'Delimiter',
        'UndetectableDelimiter',
        `Unable to auto-detect delimiting character; defaulted to '${Papa.DefaultDelimiter}'`
      );
      this._delimiterError = false;
    }

    if (this._config.skipEmptyLines) {
      for (let i = 0; i < this._results.data.length; i++)
        if (this.testEmptyLine(this._results.data[i])) this._results.data.splice(i--, 1);
    }

    if (this.needsHeaderRow()) {
      this.fillHeaderFields();
    }

    return this.applyHeaderAndDynamicTypingAndTransformation();
  }

  needsHeaderRow() {
    return this._config.header && this._fields.length === 0;
  }

  fillHeaderFields() {
    if (!this._results) return;

    const addHeder = (header) => {
      if (isFunction(this._config.transformHeader)) header = this._config.transformHeader(header);
      this._fields.push(header);
    };

    if (Array.isArray(this._results.data[0])) {
      for (let i = 0; this.needsHeaderRow() && i < this._results.data.length; i++)
        this._results.data[i].forEach(addHeder);

      this._results.data.splice(0, 1);
    }
    // if _results.data[0] is not an array, we are in a step where _results.data is the row.
    else {
      this._results.data.forEach(addHeder);
    }
  }

  shouldApplyDynamicTyping(field) {
    // Cache function values to avoid calling it for each row
    if (this._config.dynamicTypingFunction && this._config.dynamicTyping?.[field] === undefined) {
      this._config.dynamicTyping[field] = this._config.dynamicTypingFunction(field);
    }
    return (this._config.dynamicTyping?.[field] || this._config.dynamicTyping) === true;
  }

  parseDynamic(field, value) {
    if (this.shouldApplyDynamicTyping(field)) {
      if (value === 'true' || value === 'TRUE') return true;
      else if (value === 'false' || value === 'FALSE') return false;
      else if (FLOAT.test(value)) return parseFloat(value);
      else if (ISO_DATE.test(value)) return new Date(value);
      return value === '' ? null : value;
    }
    return value;
  }

  applyHeaderAndDynamicTypingAndTransformation() {
    if (
      !this._results ||
      !this._results.data ||
      (!this._config.header && !this._config.dynamicTyping && !this._config.transform)
    ) {
      return this._results;
    }

    let incrementBy = 1;
    if (!this._results.data[0] || Array.isArray(this._results.data[0])) {
      this._results.data = this._results.data.map(this.processRow.bind(this));
      incrementBy = this._results.data.length;
    } else {
      // @ts-expect-error
      this._results.data = this.processRow(this._results.data, 0);
    }

    if (this._config.header && this._results.meta) this._results.meta.fields = this._fields;

    this._rowCounter += incrementBy;
    return this._results;
  }

  processRow(rowSource, i): any[] | Record<string, any> {
    const row = this._config.header ? {} : [];

    let j;
    for (j = 0; j < rowSource.length; j++) {
      let field = j;
      let value = rowSource[j];

      if (this._config.header)
        field = j >= this._fields.length ? '__parsed_extra' : this._fields[j];

      if (this._config.transform) value = this._config.transform(value, field);

      value = this.parseDynamic(field, value);

      if (field === '__parsed_extra') {
        row[field] = row[field] || [];
        row[field].push(value);
      } else row[field] = value;
    }

    if (this._config.header) {
      if (j > this._fields.length)
        this.addError(
          'FieldMismatch',
          'TooManyFields',
          `Too many fields: expected ${this._fields.length} fields but parsed ${j}`,
          this._rowCounter + i
        );
      else if (j < this._fields.length)
        this.addError(
          'FieldMismatch',
          'TooFewFields',
          `Too few fields: expected ${this._fields.length} fields but parsed ${j}`,
          this._rowCounter + i
        );
    }

    return row;
  }

  // eslint-disable-next-line complexity, max-statements
  guessDelimiter(input, newline, skipEmptyLines, comments, delimitersToGuess) {
    let bestDelim;
    let bestDelta;
    let fieldCountPrevRow;

    delimitersToGuess = delimitersToGuess || [',', '\t', '|', ';', Papa.RECORD_SEP, Papa.UNIT_SEP];

    for (let i = 0; i < delimitersToGuess.length; i++) {
      const delim = delimitersToGuess[i];
      let avgFieldCount = 0;
      let delta = 0;
      let emptyLinesCount = 0;
      fieldCountPrevRow = undefined;

      const preview = new Parser({
        comments,
        delimiter: delim,
        newline,
        preview: 10
      }).parse(input);

      for (let j = 0; j < preview.data.length; j++) {
        if (skipEmptyLines && this.testEmptyLine(preview.data[j])) {
          emptyLinesCount++;
          continue;
        }
        const fieldCount = preview.data[j].length;
        avgFieldCount += fieldCount;

        if (typeof fieldCountPrevRow === 'undefined') {
          fieldCountPrevRow = 0;
          continue;
        } else if (fieldCount > 1) {
          delta += Math.abs(fieldCount - fieldCountPrevRow);
          fieldCountPrevRow = fieldCount;
        }
      }

      if (preview.data.length > 0) avgFieldCount /= preview.data.length - emptyLinesCount;

      if ((typeof bestDelta === 'undefined' || delta > bestDelta) && avgFieldCount > 1.99) {
        bestDelta = delta;
        bestDelim = delim;
      }
    }

    this._config.delimiter = bestDelim;

    return {
      successful: Boolean(bestDelim),
      bestDelimiter: bestDelim
    };
  }

  addError(type, code, msg, row?) {
    this._results.errors.push({
      type,
      code,
      message: msg,
      row
    });
  }
}

function guessLineEndings(input, quoteChar) {
  input = input.substr(0, 1024 * 1024); // max length 1 MB
  // Replace all the text inside quotes
  const re = new RegExp(`${escapeRegExp(quoteChar)}([^]*?)${escapeRegExp(quoteChar)}`, 'gm');
  input = input.replace(re, '');

  const r = input.split('\r');

  const n = input.split('\n');

  const nAppearsFirst = n.length > 1 && n[0].length < r[0].length;

  if (r.length === 1 || nAppearsFirst) return '\n';

  let numWithN = 0;
  for (let i = 0; i < r.length; i++) {
    if (r[i][0] === '\n') numWithN++;
  }

  return numWithN >= r.length / 2 ? '\r\n' : '\r';
}

/** https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

/** The core parser implements speedy and correct CSV parsing */
// eslint-disable-next-line complexity, max-statements
export function Parser(config: CSVParserConfig = {}) {
  // Unpack the config object
  let delim = config.delimiter;
  let newline = config.newline;
  let comments = config.comments;
  const step = config.step;
  const preview = config.preview;
  const fastMode = config.fastMode;
  let quoteChar;
  /** Allows for no quoteChar by setting quoteChar to undefined in config */
  if (config.quoteChar === undefined) {
    quoteChar = '"';
  } else {
    quoteChar = config.quoteChar;
  }
  let escapeChar = quoteChar;
  if (config.escapeChar !== undefined) {
    escapeChar = config.escapeChar;
  }

  // Delimiter must be valid
  if (typeof delim !== 'string' || Papa.BAD_DELIMITERS.indexOf(delim) > -1) delim = ',';

  // Comment character must be valid
  if (comments === delim) {
    throw new Error('Comment character same as delimiter');
  } else if (comments === true) {
    comments = '#';
  } else if (typeof comments !== 'string' || Papa.BAD_DELIMITERS.indexOf(comments) > -1) {
    comments = false;
  }

  // Newline must be valid: \r, \n, or \r\n
  if (newline !== '\n' && newline !== '\r' && newline !== '\r\n') newline = '\n';

  // We're gonna need these at the Parser scope
  let cursor = 0;
  let aborted = false;

  // @ts-expect-error
  // eslint-disable-next-line complexity, max-statements
  this.parse = function (input, baseIndex, ignoreLastRow) {
    // For some reason, in Chrome, this speeds things up (!?)
    if (typeof input !== 'string') throw new Error('Input must be a string');

    // We don't need to compute some of these every time parse() is called,
    // but having them in a more local scope seems to perform better
    const inputLen = input.length;
    const delimLen = delim.length;
    const newlineLen = newline.length;
    // @ts-expect-error
    const commentsLen = comments.length;
    const stepIsFunction = isFunction(step);

    // Establish starting state
    cursor = 0;
    let data: any[][] | Record<string, any> = [];
    let errors: any[] = [];
    let row: any[] | Record<string, any> = [];
    let lastCursor: number = 0;

    if (!input) return returnable();

    if (fastMode || (fastMode !== false && input.indexOf(quoteChar) === -1)) {
      const rows = input.split(newline);
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        cursor += row.length;
        if (i !== rows.length - 1) cursor += newline.length;
        else if (ignoreLastRow) return returnable();
        if (comments && row.substr(0, commentsLen) === comments) continue;
        if (stepIsFunction) {
          data = [];
          pushRow(row.split(delim));
          doStep();
          if (aborted) return returnable();
        } else pushRow(row.split(delim));
        if (preview && i >= preview) {
          data = data.slice(0, preview);
          return returnable(true);
        }
      }
      return returnable();
    }

    let nextDelim = input.indexOf(delim, cursor);
    let nextNewline = input.indexOf(newline, cursor);
    const quoteCharRegex = new RegExp(escapeRegExp(escapeChar) + escapeRegExp(quoteChar), 'g');
    let quoteSearch;

    // Parser loop
    for (;;) {
      // Field has opening quote
      if (input[cursor] === quoteChar) {
        // Start our search for the closing quote where the cursor is
        quoteSearch = cursor;

        // Skip the opening quote
        cursor++;

        for (;;) {
          // Find closing quote
          quoteSearch = input.indexOf(quoteChar, quoteSearch + 1);

          // No other quotes are found - no other delimiters
          if (quoteSearch === -1) {
            if (!ignoreLastRow) {
              // No closing quote... what a pity
              errors.push({
                type: 'Quotes',
                code: 'MissingQuotes',
                message: 'Quoted field unterminated',
                row: data.length, // row has yet to be inserted
                index: cursor
              });
            }
            return finish();
          }

          // Closing quote at EOF
          if (quoteSearch === inputLen - 1) {
            const value = input.substring(cursor, quoteSearch).replace(quoteCharRegex, quoteChar);
            return finish(value);
          }

          // If this quote is escaped, it's part of the data; skip it
          // If the quote character is the escape character, then check if the next character is the escape character
          if (quoteChar === escapeChar && input[quoteSearch + 1] === escapeChar) {
            quoteSearch++;
            continue;
          }

          // If the quote character is not the escape character, then check if the previous character was the escape character
          if (
            quoteChar !== escapeChar &&
            quoteSearch !== 0 &&
            input[quoteSearch - 1] === escapeChar
          ) {
            continue;
          }

          // Check up to nextDelim or nextNewline, whichever is closest
          const checkUpTo = nextNewline === -1 ? nextDelim : Math.min(nextDelim, nextNewline);
          const spacesBetweenQuoteAndDelimiter = extraSpaces(checkUpTo);

          // Closing quote followed by delimiter or 'unnecessary spaces + delimiter'
          if (input[quoteSearch + 1 + spacesBetweenQuoteAndDelimiter] === delim) {
            row.push(input.substring(cursor, quoteSearch).replace(quoteCharRegex, quoteChar));
            cursor = quoteSearch + 1 + spacesBetweenQuoteAndDelimiter + delimLen;
            nextDelim = input.indexOf(delim, cursor);
            nextNewline = input.indexOf(newline, cursor);

            if (stepIsFunction) {
              doStep();
              if (aborted) return returnable();
            }

            if (preview && data.length >= preview) return returnable(true);

            break;
          }

          const spacesBetweenQuoteAndNewLine = extraSpaces(nextNewline);

          // Closing quote followed by newline or 'unnecessary spaces + newLine'
          if (
            input.substr(quoteSearch + 1 + spacesBetweenQuoteAndNewLine, newlineLen) === newline
          ) {
            row.push(input.substring(cursor, quoteSearch).replace(quoteCharRegex, quoteChar));
            saveRow(quoteSearch + 1 + spacesBetweenQuoteAndNewLine + newlineLen);
            nextDelim = input.indexOf(delim, cursor); // because we may have skipped the nextDelim in the quoted field

            if (stepIsFunction) {
              doStep();
              if (aborted) return returnable();
            }

            if (preview && data.length >= preview) return returnable(true);

            break;
          }

          // Checks for valid closing quotes are complete (escaped quotes or quote followed by EOF/delimiter/newline) -- assume these quotes are part of an invalid text string
          errors.push({
            type: 'Quotes',
            code: 'InvalidQuotes',
            message: 'Trailing quote on quoted field is malformed',
            row: data.length, // row has yet to be inserted
            index: cursor
          });

          quoteSearch++;
          continue;
        }

        if (stepIsFunction) {
          doStep();
          if (aborted) return returnable();
        }

        if (preview && data.length >= preview) return returnable(true);
        continue;
      }

      // Comment found at start of new line
      if (comments && row.length === 0 && input.substr(cursor, commentsLen) === comments) {
        if (nextNewline === -1)
          // Comment ends at EOF
          return returnable();
        cursor = nextNewline + newlineLen;
        nextNewline = input.indexOf(newline, cursor);
        nextDelim = input.indexOf(delim, cursor);
        continue;
      }

      // Next delimiter comes before next newline, so we've reached end of field
      if (nextDelim !== -1 && (nextDelim < nextNewline || nextNewline === -1)) {
        row.push(input.substring(cursor, nextDelim));
        cursor = nextDelim + delimLen;
        nextDelim = input.indexOf(delim, cursor);
        continue;
      }

      // End of row
      if (nextNewline !== -1) {
        row.push(input.substring(cursor, nextNewline));
        saveRow(nextNewline + newlineLen);

        if (stepIsFunction) {
          doStep();
          if (aborted) return returnable();
        }

        if (preview && data.length >= preview) return returnable(true);

        continue;
      }

      break;
    }

    return finish();

    function pushRow(row) {
      data.push(row);
      lastCursor = cursor;
    }

    /**
     * checks if there are extra spaces after closing quote and given index without any text
     * if Yes, returns the number of spaces
     */
    function extraSpaces(index) {
      let spaceLength = 0;
      if (index !== -1) {
        const textBetweenClosingQuoteAndIndex = input.substring(quoteSearch + 1, index);
        if (textBetweenClosingQuoteAndIndex && textBetweenClosingQuoteAndIndex.trim() === '') {
          spaceLength = textBetweenClosingQuoteAndIndex.length;
        }
      }
      return spaceLength;
    }

    /**
     * Appends the remaining input from cursor to the end into
     * row, saves the row, calls step, and returns the results.
     */
    function finish(value?: any) {
      if (ignoreLastRow) return returnable();
      if (typeof value === 'undefined') value = input.substr(cursor);
      row.push(value);
      cursor = inputLen; // important in case parsing is paused
      pushRow(row);
      if (stepIsFunction) doStep();
      return returnable();
    }

    /**
     * Appends the current row to the results. It sets the cursor
     * to newCursor and finds the nextNewline. The caller should
     * take care to execute user's step function and check for
     * preview and end parsing if necessary.
     */
    function saveRow(newCursor) {
      cursor = newCursor;
      pushRow(row);
      row = [];
      nextNewline = input.indexOf(newline, cursor);
    }

    /** Returns an object with the results, errors, and meta. */
    function returnable(stopped?: boolean, step?) {
      const isStep = step || false;
      return {
        data: isStep ? data[0] : data,
        errors,
        meta: {
          delimiter: delim,
          linebreak: newline,
          aborted,
          truncated: Boolean(stopped),
          cursor: lastCursor + (baseIndex || 0)
        }
      };
    }

    /** Executes the user's step function and resets data & errors. */
    function doStep() {
      // @ts-expect-error
      step(returnable(undefined, true));
      data = [];
      errors = [];
    }
  };

  /** Sets the abort flag */
  // @ts-expect-error
  this.abort = function () {
    aborted = true;
  };

  /** Gets the cursor position */
  // @ts-expect-error
  this.getCharIndex = function () {
    return cursor;
  };
}

/** Makes a deep copy of an array or object (mostly) */
function copy(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  const cpy = Array.isArray(obj) ? [] : {};
  for (const key in obj) cpy[key] = copy(obj[key]);
  return cpy;
}

function isFunction(func: unknown): func is Function {
  return typeof func === 'function';
}
