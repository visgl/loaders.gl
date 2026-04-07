// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrowTable, Schema} from '@loaders.gl/schema';
import * as arrow from 'apache-arrow';

import type {CSVRawArrowOptions} from '../../csv-raw-arrow-loader';

/** Normalized ASCII-byte CSV options used by the raw Arrow byte parser. */
type CSVByteParserOptions = {
  delimiter: number;
  quote: number;
  columnPrefix: string;
  header: boolean | 'auto';
  dynamicTyping: boolean;
  skipEmptyLines: boolean | 'greedy';
};

/** Reusable field metadata object used to avoid per-field allocation. */
type CSVByteFieldScratch = {
  fieldStart: number;
  fieldEnd: number;
  isQuotedField: boolean;
  quotedFieldStart: number;
  quotedFieldEnd: number;
  escapedSegmentStart: number;
  escapedFieldBuilder: ByteRangeBuilder | null;
  escapedDirectColumnBuilder: RawArrowUtf8ColumnBuilder | null;
};

const CARRIAGE_RETURN = 13;
const LINE_FEED = 10;
const SPACE = 32;
const TAB = 9;

const FLOAT = /^\s*-?(\d*\.?\d+|\d+\.?\d*)(e[-+]?\d+)?\s*$/i;
const ISO_DATE =
  /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/;

const textDecoder = new TextDecoder();

/** Parse common raw CSV input directly from UTF-8 bytes into an Arrow Utf8 table. */
export function parseRawArrowCSVBytes(
  arrayBuffer: ArrayBuffer,
  csvOptions: CSVRawArrowOptions
): ArrowTable | null {
  const parserOptions = getCSVByteParserOptions(arrayBuffer, csvOptions);
  if (!parserOptions) {
    return null;
  }

  const bytes = new Uint8Array(arrayBuffer);
  if (!parserOptions.skipEmptyLines && bytes.indexOf(parserOptions.quote) === -1) {
    const parser = new RawArrowUnquotedCSVByteParser(bytes, parserOptions);
    return parser.parseTable();
  }

  const simpleHeaderRowEnd = findSimpleHeaderRowEnd(bytes, parserOptions.quote);
  if (
    !parserOptions.skipEmptyLines &&
    simpleHeaderRowEnd &&
    (parserOptions.header === true || parserOptions.header === 'auto')
  ) {
    const parser = new RawArrowQuotedDirectCSVByteParser(bytes, parserOptions, simpleHeaderRowEnd);
    return parser.parseTable();
  }

  const parser = new RawArrowCSVByteParser(bytes, parserOptions);
  return parser.parseTable();
}

/** Returns byte parser options when the CSV options are safe for the raw byte fast path. */
function getCSVByteParserOptions(
  arrayBuffer: ArrayBuffer,
  csvOptions: CSVRawArrowOptions
): CSVByteParserOptions | null {
  if (csvOptions.comments) {
    return null;
  }

  const quoteChar = csvOptions.quoteChar || '"';
  const escapeChar = csvOptions.escapeChar || '"';
  if (quoteChar.length !== 1 || escapeChar !== quoteChar) {
    return null;
  }

  const delimiter = getDelimiter(csvOptions, new Uint8Array(arrayBuffer), quoteChar.charCodeAt(0));
  if (delimiter === null) {
    return null;
  }

  return {
    delimiter,
    quote: quoteChar.charCodeAt(0),
    columnPrefix: csvOptions.columnPrefix || 'column',
    header: csvOptions.header ?? false,
    dynamicTyping: Boolean(csvOptions.dynamicTyping),
    skipEmptyLines: csvOptions.skipEmptyLines || false
  };
}

/** Selects the configured delimiter or guesses one from the first row. */
function getDelimiter(
  csvOptions: CSVRawArrowOptions,
  bytes: Uint8Array,
  quote: number
): number | null {
  const configuredDelimiter = (csvOptions as CSVRawArrowOptions & {delimiter?: string}).delimiter;
  if (configuredDelimiter) {
    return configuredDelimiter.length === 1 && configuredDelimiter.charCodeAt(0) < 128
      ? configuredDelimiter.charCodeAt(0)
      : null;
  }

  const delimitersToGuess = csvOptions.delimitersToGuess || [',', '\t', '|', ';'];
  let selectedDelimiter: number | null = null;
  let selectedDelimiterCount = -1;

  for (const delimiter of delimitersToGuess) {
    if (delimiter.length !== 1 || delimiter.charCodeAt(0) >= 128) {
      continue;
    }
    const delimiterByte = delimiter.charCodeAt(0);
    const delimiterCount = countFirstRowDelimiters(bytes, delimiterByte, quote);
    if (delimiterCount > selectedDelimiterCount) {
      selectedDelimiter = delimiterByte;
      selectedDelimiterCount = delimiterCount;
    }
  }

  return selectedDelimiter;
}

/** Counts candidate delimiters in the first CSV row while respecting quoted spans. */
function countFirstRowDelimiters(bytes: Uint8Array, delimiter: number, quote: number): number {
  let delimiterCount = 0;
  let isInsideQuotes = false;

  for (let byteIndex = 0; byteIndex < bytes.length; byteIndex++) {
    const byte = bytes[byteIndex];
    if (byte === quote) {
      if (isInsideQuotes && bytes[byteIndex + 1] === quote) {
        byteIndex++;
      } else {
        isInsideQuotes = !isInsideQuotes;
      }
      continue;
    }

    if (!isInsideQuotes) {
      if (byte === delimiter) {
        delimiterCount++;
      } else if (byte === LINE_FEED || byte === CARRIAGE_RETURN) {
        break;
      }
    }
  }

  return delimiterCount;
}

/** Returns the first row end when the header row can be decoded without quote handling. */
function findSimpleHeaderRowEnd(
  bytes: Uint8Array,
  quote: number
): {end: number; nextStart: number} | null {
  for (let byteIndex = 0; byteIndex < bytes.length; byteIndex++) {
    const byte = bytes[byteIndex];
    if (byte === quote) {
      return null;
    }

    if (byte === LINE_FEED || byte === CARRIAGE_RETURN) {
      const nextStart =
        byte === CARRIAGE_RETURN && bytes[byteIndex + 1] === LINE_FEED
          ? byteIndex + 2
          : byteIndex + 1;
      return {end: byteIndex, nextStart};
    }
  }

  return {end: bytes.length, nextStart: bytes.length};
}

/**
 * Selects the earliest found structural byte index.
 *
 * The raw parser only searches for ASCII CSV syntax bytes such as comma, tab,
 * quote, CR and LF. In valid UTF-8, non-ASCII characters use leading bytes
 * 0xc2-0xf4 and continuation bytes 0x80-0xbf, so these ASCII syntax bytes
 * cannot be mistaken for part of a multi-byte character.
 */
function selectEarlierIndex(currentIndex: number, nextIndex: number): number {
  if (nextIndex < 0) {
    return currentIndex;
  }
  return currentIndex < 0 || nextIndex < currentIndex ? nextIndex : currentIndex;
}

/** Stateful single-buffer byte CSV parser that appends cell bytes into Arrow Utf8 columns. */
class RawArrowCSVByteParser {
  private readonly bytes: Uint8Array;
  private readonly options: CSVByteParserOptions;
  private readonly duplicateColumnTransformer = createDuplicateColumnTransformer();
  private readonly fieldScratch: CSVByteFieldScratch = {
    fieldStart: 0,
    fieldEnd: 0,
    isQuotedField: false,
    quotedFieldStart: 0,
    quotedFieldEnd: 0,
    escapedSegmentStart: 0,
    escapedFieldBuilder: null,
    escapedDirectColumnBuilder: null
  };
  private headerRow: string[] | null = null;
  private columnBuilders: RawArrowUtf8ColumnBuilder[] | null = null;
  private isFirstDataRow = true;

  constructor(bytes: Uint8Array, options: CSVByteParserOptions) {
    this.bytes = bytes;
    this.options = options;
  }

  /** Parses all bytes and returns a loaders.gl Arrow table. */
  parseTable(): ArrowTable {
    const rowFields = new CSVByteRowBuilder();
    let fieldStart = 0;
    let quotedFieldStart = 0;
    let quotedFieldEnd = 0;
    let escapedFieldBuilder: ByteRangeBuilder | null = null;
    let escapedSegmentStart = 0;
    let escapedDirectColumnBuilder: RawArrowUtf8ColumnBuilder | null = null;
    let isInsideQuotes = false;
    let isQuotedField = false;
    let previousTokenWasDelimiter = false;
    let columnIndex = 0;
    const fieldScratch = this.fieldScratch;

    for (let byteIndex = 0; byteIndex < this.bytes.length; byteIndex++) {
      const byte = this.bytes[byteIndex];

      if (isInsideQuotes) {
        if (byte === this.options.quote) {
          if (this.bytes[byteIndex + 1] === this.options.quote) {
            if (this.columnBuilders && !this.options.skipEmptyLines) {
              const columnBuilder =
                escapedDirectColumnBuilder || this.columnBuilders[columnIndex] || null;
              if (columnBuilder) {
                columnBuilder.appendPartialRange(this.bytes, escapedSegmentStart, byteIndex);
                columnBuilder.appendPartialByte(this.options.quote);
                escapedDirectColumnBuilder = columnBuilder;
              }
            } else {
              escapedFieldBuilder =
                escapedFieldBuilder ||
                new ByteRangeBuilder(Math.max(16, byteIndex - escapedSegmentStart + 1));
              escapedFieldBuilder.append(this.bytes, escapedSegmentStart, byteIndex);
              escapedFieldBuilder.appendByte(this.options.quote);
            }
            byteIndex++;
            escapedSegmentStart = byteIndex + 1;
          } else {
            isInsideQuotes = false;
            quotedFieldEnd = byteIndex;
          }
        }
        continue;
      }

      if (byte === this.options.quote && byteIndex === fieldStart) {
        isInsideQuotes = true;
        isQuotedField = true;
        quotedFieldStart = byteIndex + 1;
        escapedSegmentStart = quotedFieldStart;
        previousTokenWasDelimiter = false;
        continue;
      }

      if (byte === this.options.delimiter) {
        fieldScratch.fieldStart = fieldStart;
        fieldScratch.fieldEnd = byteIndex;
        fieldScratch.isQuotedField = isQuotedField;
        fieldScratch.quotedFieldStart = quotedFieldStart;
        fieldScratch.quotedFieldEnd = quotedFieldEnd;
        fieldScratch.escapedSegmentStart = escapedSegmentStart;
        fieldScratch.escapedFieldBuilder = escapedFieldBuilder;
        fieldScratch.escapedDirectColumnBuilder = escapedDirectColumnBuilder;
        if (this.columnBuilders && !this.options.skipEmptyLines) {
          this.appendField(columnIndex);
          columnIndex++;
        } else {
          this.addField(rowFields);
        }
        fieldStart = byteIndex + 1;
        isQuotedField = false;
        quotedFieldEnd = 0;
        escapedFieldBuilder = null;
        escapedDirectColumnBuilder = null;
        previousTokenWasDelimiter = true;
        continue;
      }

      if (byte === LINE_FEED || byte === CARRIAGE_RETURN) {
        fieldScratch.fieldStart = fieldStart;
        fieldScratch.fieldEnd = byteIndex;
        fieldScratch.isQuotedField = isQuotedField;
        fieldScratch.quotedFieldStart = quotedFieldStart;
        fieldScratch.quotedFieldEnd = quotedFieldEnd;
        fieldScratch.escapedSegmentStart = escapedSegmentStart;
        fieldScratch.escapedFieldBuilder = escapedFieldBuilder;
        fieldScratch.escapedDirectColumnBuilder = escapedDirectColumnBuilder;
        if (this.columnBuilders && !this.options.skipEmptyLines) {
          this.appendField(columnIndex);
          this.appendMissingFields(columnIndex + 1);
          columnIndex = 0;
        } else {
          this.addField(rowFields);
          this.addRow(rowFields);
          rowFields.reset();
        }
        if (byte === CARRIAGE_RETURN && this.bytes[byteIndex + 1] === LINE_FEED) {
          byteIndex++;
        }
        fieldStart = byteIndex + 1;
        isQuotedField = false;
        quotedFieldEnd = 0;
        escapedFieldBuilder = null;
        escapedDirectColumnBuilder = null;
        previousTokenWasDelimiter = false;
        continue;
      }

      previousTokenWasDelimiter = false;
    }

    if (fieldStart < this.bytes.length || previousTokenWasDelimiter || rowFields.count > 0) {
      fieldScratch.fieldStart = fieldStart;
      fieldScratch.fieldEnd = this.bytes.length;
      fieldScratch.isQuotedField = isQuotedField;
      fieldScratch.quotedFieldStart = quotedFieldStart;
      fieldScratch.quotedFieldEnd = quotedFieldEnd;
      fieldScratch.escapedSegmentStart = escapedSegmentStart;
      fieldScratch.escapedFieldBuilder = escapedFieldBuilder;
      fieldScratch.escapedDirectColumnBuilder = escapedDirectColumnBuilder;
      if (this.columnBuilders && !this.options.skipEmptyLines) {
        this.appendField(columnIndex);
        this.appendMissingFields(columnIndex + 1);
      } else {
        this.addField(rowFields);
        this.addRow(rowFields);
      }
    }

    return this.finishTable();
  }

  private addField(rowFields: CSVByteRowBuilder): void {
    const fieldScratch = this.fieldScratch;
    if (!fieldScratch.isQuotedField) {
      rowFields.addField(fieldScratch.fieldStart, fieldScratch.fieldEnd);
      return;
    }

    const effectiveQuotedFieldEnd = fieldScratch.quotedFieldEnd || fieldScratch.fieldEnd;
    if (fieldScratch.escapedFieldBuilder) {
      fieldScratch.escapedFieldBuilder.append(
        this.bytes,
        fieldScratch.escapedSegmentStart,
        effectiveQuotedFieldEnd
      );
      rowFields.addField(0, 0, fieldScratch.escapedFieldBuilder.finish());
      return;
    }

    rowFields.addField(fieldScratch.quotedFieldStart, effectiveQuotedFieldEnd);
  }

  private addRow(rowFields: CSVByteRowBuilder): void {
    if (this.options.skipEmptyLines && this.isEmptyRow(rowFields)) {
      return;
    }

    if (this.isFirstDataRow && !this.headerRow) {
      const isHeader =
        this.options.header === 'auto' ? this.isHeaderRow(rowFields) : Boolean(this.options.header);
      if (isHeader) {
        this.headerRow = [];
        for (let fieldIndex = 0; fieldIndex < rowFields.count; fieldIndex++) {
          this.headerRow.push(
            this.duplicateColumnTransformer(this.decodeField(rowFields, fieldIndex))
          );
        }
        return;
      }
    }

    if (this.isFirstDataRow) {
      this.isFirstDataRow = false;
      this.headerRow = this.headerRow || generateHeader(this.options.columnPrefix, rowFields.count);
      this.columnBuilders = createRawArrowColumnBuilders(this.headerRow, this.bytes.length);
    }

    this.appendRow(rowFields);
  }

  private appendRow(rowFields: CSVByteRowBuilder): void {
    if (!this.columnBuilders) {
      return;
    }

    for (let columnIndex = 0; columnIndex < this.columnBuilders.length; columnIndex++) {
      if (columnIndex < rowFields.count) {
        this.columnBuilders[columnIndex].appendField(rowFields, this.bytes, columnIndex);
      } else {
        this.columnBuilders[columnIndex].appendNull();
      }
    }
  }

  /** Appends the current parsed field directly into its Arrow column. */
  private appendField(columnIndex: number): void {
    const columnBuilder = this.columnBuilders?.[columnIndex];
    if (!columnBuilder) {
      return;
    }

    const fieldScratch = this.fieldScratch;
    if (!fieldScratch.isQuotedField) {
      columnBuilder.appendRange(this.bytes, fieldScratch.fieldStart, fieldScratch.fieldEnd);
      return;
    }

    const effectiveQuotedFieldEnd = fieldScratch.quotedFieldEnd || fieldScratch.fieldEnd;
    if (fieldScratch.escapedFieldBuilder) {
      fieldScratch.escapedFieldBuilder.append(
        this.bytes,
        fieldScratch.escapedSegmentStart,
        effectiveQuotedFieldEnd
      );
      columnBuilder.appendByteRangeBuilder(fieldScratch.escapedFieldBuilder);
      return;
    }

    if (fieldScratch.escapedDirectColumnBuilder) {
      fieldScratch.escapedDirectColumnBuilder.appendPartialRange(
        this.bytes,
        fieldScratch.escapedSegmentStart,
        effectiveQuotedFieldEnd
      );
      fieldScratch.escapedDirectColumnBuilder.finishPartialValue();
      return;
    }

    columnBuilder.appendRange(this.bytes, fieldScratch.quotedFieldStart, effectiveQuotedFieldEnd);
  }

  /** Appends nulls for missing trailing fields in the current row. */
  private appendMissingFields(startColumnIndex: number): void {
    if (!this.columnBuilders) {
      return;
    }

    for (
      let columnIndex = startColumnIndex;
      columnIndex < this.columnBuilders.length;
      columnIndex++
    ) {
      this.columnBuilders[columnIndex].appendNull();
    }
  }

  private finishTable(): ArrowTable {
    const columnBuilders =
      this.columnBuilders || createRawArrowColumnBuilders(this.headerRow || [], this.bytes.length);
    return createRawArrowTable(this.headerRow || [], columnBuilders);
  }

  private decodeField(rowFields: CSVByteRowBuilder, fieldIndex: number): string {
    const data =
      rowFields.fieldData[fieldIndex] ||
      this.bytes.subarray(rowFields.starts[fieldIndex], rowFields.ends[fieldIndex]);
    return textDecoder.decode(data);
  }

  private isEmptyRow(rowFields: CSVByteRowBuilder): boolean {
    if (this.options.skipEmptyLines === true) {
      return this.isStrictEmptyRow(rowFields);
    }

    for (let fieldIndex = 0; fieldIndex < rowFields.count; fieldIndex++) {
      const data = rowFields.fieldData[fieldIndex];
      if (data) {
        if (!isEmptyByteRange(data, 0, data.length)) {
          return false;
        }
      } else if (
        !isEmptyByteRange(this.bytes, rowFields.starts[fieldIndex], rowFields.ends[fieldIndex])
      ) {
        return false;
      }
    }
    return true;
  }

  private isStrictEmptyRow(rowFields: CSVByteRowBuilder): boolean {
    if (rowFields.count !== 1) {
      return false;
    }

    const data = rowFields.fieldData[0];
    return data ? data.length === 0 : rowFields.starts[0] === rowFields.ends[0];
  }

  private isHeaderRow(rowFields: CSVByteRowBuilder): boolean {
    for (let fieldIndex = 0; fieldIndex < rowFields.count; fieldIndex++) {
      if (!isHeaderValue(this.decodeField(rowFields, fieldIndex), this.options.dynamicTyping)) {
        return false;
      }
    }
    return rowFields.count > 0;
  }
}

/** Reusable field buffer for one parsed row. */
class CSVByteRowBuilder {
  readonly starts: number[] = [];
  readonly ends: number[] = [];
  readonly fieldData: Array<Uint8Array | undefined> = [];
  count = 0;

  /** Appends one field range, optionally backed by unescaped copied data. */
  addField(start: number, end: number, data?: Uint8Array): void {
    const fieldIndex = this.count;
    this.starts[fieldIndex] = start;
    this.ends[fieldIndex] = end;
    this.fieldData[fieldIndex] = data;
    this.count++;
  }

  /** Reuses the row buffers for the next row. */
  reset(): void {
    this.count = 0;
  }
}

/** Direct byte parser for quoted CSV inputs with an already-identified simple header row. */
class RawArrowQuotedDirectCSVByteParser {
  private readonly bytes: Uint8Array;
  private readonly options: CSVByteParserOptions;
  private readonly firstRowEnd: {end: number; nextStart: number};
  private readonly duplicateColumnTransformer = createDuplicateColumnTransformer();
  private headerRow: string[] = [];
  private columnBuilders: RawArrowUtf8ColumnBuilder[] = [];

  constructor(
    bytes: Uint8Array,
    options: CSVByteParserOptions,
    firstRowEnd: {end: number; nextStart: number}
  ) {
    this.bytes = bytes;
    this.options = options;
    this.firstRowEnd = firstRowEnd;
  }

  /** Parses all bytes and returns a loaders.gl Arrow table. */
  parseTable(): ArrowTable {
    if (this.bytes.length === 0) {
      return createRawArrowTable([], []);
    }

    this.headerRow = this.decodeHeaderRow(0, this.firstRowEnd.end);
    this.columnBuilders = createRawArrowColumnBuilders(this.headerRow, this.bytes.length);
    this.appendDataRows(this.firstRowEnd.nextStart);
    return createRawArrowTable(this.headerRow, this.columnBuilders);
  }

  private appendDataRows(start: number): void {
    const columnCount = this.columnBuilders.length;
    const bytes = this.bytes;
    const delimiter = this.options.delimiter;
    const quote = this.options.quote;
    let fieldStart = start;
    let byteIndex = start;
    let columnIndex = 0;

    while (byteIndex <= bytes.length) {
      const byte = bytes[byteIndex];

      if (byte === quote && byteIndex === fieldStart) {
        const quotedFieldStart = fieldStart + 1;
        let quotedFieldEnd = bytes.length;
        let escapedQuoteCount = 0;
        let scanStart = quotedFieldStart;

        while (scanStart < bytes.length) {
          const quoteIndex = bytes.indexOf(quote, scanStart);
          if (quoteIndex < 0) {
            break;
          }

          if (bytes[quoteIndex + 1] === quote) {
            escapedQuoteCount++;
            scanStart = quoteIndex + 2;
          } else {
            quotedFieldEnd = quoteIndex;
            scanStart = quoteIndex + 1;
            break;
          }
        }

        this.appendField(
          columnIndex,
          fieldStart,
          quotedFieldEnd,
          quotedFieldStart,
          escapedQuoteCount
        );
        const tokenIndex = this.findNextTokenIndex(scanStart);
        columnIndex++;

        if (tokenIndex < 0) {
          this.appendMissingFields(columnIndex, columnCount);
          break;
        }

        const token = bytes[tokenIndex];
        if (token === delimiter) {
          byteIndex = tokenIndex + 1;
          fieldStart = byteIndex;
          continue;
        }

        this.appendMissingFields(columnIndex, columnCount);
        columnIndex = 0;
        byteIndex =
          token === CARRIAGE_RETURN && bytes[tokenIndex + 1] === LINE_FEED
            ? tokenIndex + 2
            : tokenIndex + 1;
        fieldStart = byteIndex;
        if (byteIndex >= bytes.length) {
          break;
        }
        continue;
      }

      if (
        byte === delimiter ||
        byte === LINE_FEED ||
        byte === CARRIAGE_RETURN ||
        byteIndex === bytes.length
      ) {
        this.appendField(columnIndex, fieldStart, byteIndex, -1, 0);
        columnIndex++;

        if (byte === LINE_FEED || byte === CARRIAGE_RETURN || byteIndex === bytes.length) {
          this.appendMissingFields(columnIndex, columnCount);
          columnIndex = 0;
          if (byte === CARRIAGE_RETURN && bytes[byteIndex + 1] === LINE_FEED) {
            byteIndex++;
          }
        }

        byteIndex++;
        fieldStart = byteIndex;
        if (byteIndex >= bytes.length) {
          break;
        }
        continue;
      }

      const tokenIndex = this.findNextTokenIndex(byteIndex);
      byteIndex = tokenIndex < 0 ? bytes.length : tokenIndex;
    }
  }

  private findNextTokenIndex(start: number): number {
    const bytes = this.bytes;
    const byte = bytes[start];
    if (byte === this.options.delimiter || byte === LINE_FEED || byte === CARRIAGE_RETURN) {
      return start;
    }

    const scanStart = start + 1;
    let tokenIndex = bytes.indexOf(this.options.delimiter, scanStart);
    tokenIndex = selectEarlierIndex(tokenIndex, bytes.indexOf(LINE_FEED, scanStart));
    tokenIndex = selectEarlierIndex(tokenIndex, bytes.indexOf(CARRIAGE_RETURN, scanStart));
    return tokenIndex;
  }

  private appendField(
    columnIndex: number,
    fieldStart: number,
    fieldEnd: number,
    quotedFieldStart: number,
    escapedQuoteCount: number
  ): void {
    const columnBuilder = this.columnBuilders[columnIndex];
    if (!columnBuilder) {
      return;
    }

    if (quotedFieldStart < 0) {
      columnBuilder.appendRange(this.bytes, fieldStart, fieldEnd);
      return;
    }

    if (escapedQuoteCount > 0) {
      columnBuilder.appendEscapedQuotedRange(
        this.bytes,
        quotedFieldStart,
        fieldEnd,
        this.options.quote,
        escapedQuoteCount
      );
      return;
    }

    columnBuilder.appendRange(this.bytes, quotedFieldStart, fieldEnd);
  }

  private appendMissingFields(startColumnIndex: number, columnCount: number): void {
    for (let columnIndex = startColumnIndex; columnIndex < columnCount; columnIndex++) {
      this.columnBuilders[columnIndex].appendNull();
    }
  }

  private decodeHeaderRow(start: number, end: number): string[] {
    const headerRow: string[] = [];
    let fieldStart = start;
    for (let byteIndex = start; byteIndex <= end; byteIndex++) {
      if (byteIndex === end || this.bytes[byteIndex] === this.options.delimiter) {
        const columnName = textDecoder.decode(this.bytes.subarray(fieldStart, byteIndex));
        headerRow.push(this.duplicateColumnTransformer(columnName));
        fieldStart = byteIndex + 1;
      }
    }
    return headerRow;
  }
}

/** Single-buffer byte parser for CSV inputs that contain no quote bytes. */
class RawArrowUnquotedCSVByteParser {
  private readonly bytes: Uint8Array;
  private readonly options: CSVByteParserOptions;
  private readonly duplicateColumnTransformer = createDuplicateColumnTransformer();
  private headerRow: string[] = [];
  private columnBuilders: RawArrowUtf8ColumnBuilder[] = [];

  constructor(bytes: Uint8Array, options: CSVByteParserOptions) {
    this.bytes = bytes;
    this.options = options;
  }

  /** Parses all bytes and returns a loaders.gl Arrow table. */
  parseTable(): ArrowTable {
    if (this.bytes.length === 0) {
      return createRawArrowTable([], []);
    }

    let dataStart = 0;
    const firstRow = this.findRowEnd(0);
    const isHeader = this.options.header === 'auto' ? true : Boolean(this.options.header);

    if (isHeader) {
      this.headerRow = this.decodeHeaderRow(0, firstRow.end);
      dataStart = firstRow.nextStart;
    } else {
      this.headerRow = generateHeader(
        this.options.columnPrefix,
        countDelimitedFields(this.bytes, 0, firstRow.end, this.options.delimiter)
      );
    }

    this.columnBuilders = createRawArrowColumnBuilders(this.headerRow, this.bytes.length);
    this.appendDataRows(dataStart);
    return createRawArrowTable(this.headerRow, this.columnBuilders);
  }

  private appendDataRows(start: number): void {
    const columnCount = this.columnBuilders.length;
    let rowStart = start;

    while (rowStart < this.bytes.length) {
      const rowEnd = this.findRowEnd(rowStart);
      let fieldStart = rowStart;
      let columnIndex = 0;

      while (fieldStart <= rowEnd.end) {
        const delimiterIndex = this.bytes.indexOf(this.options.delimiter, fieldStart);
        if (delimiterIndex >= 0 && delimiterIndex < rowEnd.end) {
          this.appendField(columnIndex, fieldStart, delimiterIndex);
          columnIndex++;
          fieldStart = delimiterIndex + 1;
        } else {
          this.appendField(columnIndex, fieldStart, rowEnd.end);
          this.appendMissingFields(columnIndex + 1, columnCount);
          break;
        }
      }

      rowStart = rowEnd.nextStart;
    }
  }

  private appendField(columnIndex: number, start: number, end: number): void {
    const columnBuilder = this.columnBuilders[columnIndex];
    if (columnBuilder) {
      columnBuilder.appendRange(this.bytes, start, end);
    }
  }

  private appendMissingFields(startColumnIndex: number, columnCount: number): void {
    for (let columnIndex = startColumnIndex; columnIndex < columnCount; columnIndex++) {
      this.columnBuilders[columnIndex].appendNull();
    }
  }

  private decodeHeaderRow(start: number, end: number): string[] {
    const headerRow: string[] = [];
    let fieldStart = start;
    for (let byteIndex = start; byteIndex <= end; byteIndex++) {
      if (byteIndex === end || this.bytes[byteIndex] === this.options.delimiter) {
        const columnName = textDecoder.decode(this.bytes.subarray(fieldStart, byteIndex));
        headerRow.push(this.duplicateColumnTransformer(columnName));
        fieldStart = byteIndex + 1;
      }
    }
    return headerRow;
  }

  private findRowEnd(start: number): {end: number; nextStart: number} {
    for (let byteIndex = start; byteIndex < this.bytes.length; byteIndex++) {
      const byte = this.bytes[byteIndex];
      if (byte === LINE_FEED || byte === CARRIAGE_RETURN) {
        const nextStart =
          byte === CARRIAGE_RETURN && this.bytes[byteIndex + 1] === LINE_FEED
            ? byteIndex + 2
            : byteIndex + 1;
        return {end: byteIndex, nextStart};
      }
    }
    return {end: this.bytes.length, nextStart: this.bytes.length};
  }
}

/** Accumulates unescaped quoted field bytes without converting the field to a string. */
class ByteRangeBuilder {
  private data: Uint8Array;
  private length = 0;

  constructor(initialCapacity: number) {
    this.data = new Uint8Array(initialCapacity);
  }

  /** Appends a byte range. */
  append(source: Uint8Array, start: number, end: number): void {
    const byteLength = end - start;
    this.reserve(byteLength);
    copyByteRange(source, start, end, this.data, this.length);
    this.length += byteLength;
  }

  /** Appends a single byte. */
  appendByte(byte: number): void {
    this.reserve(1);
    this.data[this.length] = byte;
    this.length++;
  }

  /** Returns the accumulated bytes. */
  finish(): Uint8Array {
    return this.data.subarray(0, this.length);
  }

  /** Copies the accumulated bytes into a target array. */
  copyTo(target: Uint8Array, targetStart: number): void {
    copyByteRange(this.data, 0, this.length, target, targetStart);
  }

  /** Returns the number of accumulated bytes. */
  getLength(): number {
    return this.length;
  }

  private reserve(byteLength: number): void {
    const requiredLength = this.length + byteLength;
    if (requiredLength <= this.data.length) {
      return;
    }

    let nextCapacity = Math.max(1, this.data.length);
    while (nextCapacity < requiredLength) {
      nextCapacity *= 2;
    }

    const nextData = new Uint8Array(nextCapacity);
    nextData.set(this.data.subarray(0, this.length));
    this.data = nextData;
  }
}

/** Accumulates Arrow Utf8 value offsets, value bytes, and optional null bitmap. */
class RawArrowUtf8ColumnBuilder {
  private data: Uint8Array;
  private dataLength = 0;
  private valueOffsets: Int32Array;
  private valueOffsetCount = 1;
  private nullBitmap: Uint8Array | null = null;
  private nullCount = 0;

  constructor(initialValueCapacity: number = 1024, initialDataCapacity: number = 4096) {
    this.data = new Uint8Array(initialDataCapacity);
    this.valueOffsets = new Int32Array(initialValueCapacity);
  }

  /** Appends a parsed CSV field as a non-null Utf8 value. */
  appendField(rowFields: CSVByteRowBuilder, source: Uint8Array, fieldIndex: number): void {
    const fieldData = rowFields.fieldData[fieldIndex];
    if (fieldData) {
      this.appendValue(fieldData, 0, fieldData.length);
    } else {
      this.appendValue(source, rowFields.starts[fieldIndex], rowFields.ends[fieldIndex]);
    }
  }

  /** Appends a null value for rows with missing columns. */
  appendNull(): void {
    this.ensureNullBitmap();
    this.nullCount++;
    this.appendValueOffset(this.dataLength);
  }

  /** Returns an Arrow Utf8 Data object backed by the accumulated bytes. */
  finishData(): arrow.Data<arrow.Utf8> {
    const rowCount = this.valueOffsetCount - 1;
    return arrow.makeData({
      type: new arrow.Utf8(),
      valueOffsets: this.valueOffsets.subarray(0, this.valueOffsetCount),
      data: this.data.subarray(0, this.dataLength),
      nullBitmap: this.nullBitmap
        ? this.nullBitmap.subarray(0, Math.ceil(rowCount / 8))
        : undefined,
      nullCount: this.nullCount
    });
  }

  private appendValue(source: Uint8Array, start: number, end: number): void {
    this.appendDataRange(source, start, end);
    this.appendValueOffset(this.dataLength);
    this.setValid(this.valueOffsetCount - 2);
  }

  /** Appends a non-null value from a byte range. */
  appendRange(source: Uint8Array, start: number, end: number): void {
    this.appendValue(source, start, end);
  }

  /** Appends an escaped quoted value by collapsing doubled quote bytes. */
  appendEscapedQuotedRange(
    source: Uint8Array,
    start: number,
    end: number,
    quote: number,
    escapedQuoteCount: number
  ): void {
    this.reserveData(end - start - escapedQuoteCount);
    this.copyEscapedQuotedRange(source, start, end, quote);
    this.appendValueOffset(this.dataLength);
    this.setValid(this.valueOffsetCount - 2);
  }

  /** Appends a non-null value from a reusable byte range builder. */
  appendByteRangeBuilder(byteRangeBuilder: ByteRangeBuilder): void {
    const dataLength = byteRangeBuilder.getLength();
    this.reserveData(dataLength);
    byteRangeBuilder.copyTo(this.data, this.dataLength);
    this.dataLength += dataLength;
    this.appendValueOffset(this.dataLength);
    this.setValid(this.valueOffsetCount - 2);
  }

  /** Appends a byte range to the in-progress value. */
  appendPartialRange(source: Uint8Array, start: number, end: number): void {
    this.appendDataRange(source, start, end);
  }

  /** Appends one byte to the in-progress value. */
  appendPartialByte(byte: number): void {
    this.reserveData(1);
    this.data[this.dataLength] = byte;
    this.dataLength++;
  }

  /** Finishes the in-progress value. */
  finishPartialValue(): void {
    this.appendValueOffset(this.dataLength);
    this.setValid(this.valueOffsetCount - 2);
  }

  private appendDataRange(source: Uint8Array, start: number, end: number): void {
    const byteLength = end - start;
    if (byteLength <= 0) {
      return;
    }

    this.reserveData(byteLength);
    copyByteRange(source, start, end, this.data, this.dataLength);
    this.dataLength += byteLength;
  }

  /** Copies one escaped quoted range while collapsing doubled quote escapes. */
  private copyEscapedQuotedRange(
    source: Uint8Array,
    start: number,
    end: number,
    quote: number
  ): void {
    for (let byteIndex = start; byteIndex < end; byteIndex++) {
      const byte = source[byteIndex];
      this.data[this.dataLength] = byte;
      this.dataLength++;
      if (byte === quote && source[byteIndex + 1] === quote) {
        byteIndex++;
      }
    }
  }

  private reserveData(byteLength: number): void {
    const requiredLength = this.dataLength + byteLength;
    if (requiredLength <= this.data.length) {
      return;
    }

    let nextCapacity = Math.max(1, this.data.length);
    while (nextCapacity < requiredLength) {
      nextCapacity *= 2;
    }

    const nextData = new Uint8Array(nextCapacity);
    nextData.set(this.data.subarray(0, this.dataLength));
    this.data = nextData;
  }

  private ensureNullBitmap(): void {
    const rowIndex = this.valueOffsetCount - 1;
    const requiredByteLength = Math.ceil((rowIndex + 1) / 8);
    if (!this.nullBitmap) {
      this.nullBitmap = new Uint8Array(Math.max(requiredByteLength, 1));
      for (let validRowIndex = 0; validRowIndex < rowIndex; validRowIndex++) {
        this.nullBitmap[validRowIndex >> 3] |= 1 << (validRowIndex % 8);
      }
      return;
    }

    if (requiredByteLength > this.nullBitmap.length) {
      const nextNullBitmap = new Uint8Array(requiredByteLength * 2);
      nextNullBitmap.set(this.nullBitmap);
      this.nullBitmap = nextNullBitmap;
    }
  }

  private setValid(rowIndex: number): void {
    if (!this.nullBitmap) {
      return;
    }
    this.ensureNullBitmap();
    this.nullBitmap[rowIndex >> 3] |= 1 << (rowIndex % 8);
  }

  private appendValueOffset(valueOffset: number): void {
    if (this.valueOffsetCount >= this.valueOffsets.length) {
      const nextValueOffsets = new Int32Array(this.valueOffsets.length * 2);
      nextValueOffsets.set(this.valueOffsets);
      this.valueOffsets = nextValueOffsets;
    }
    this.valueOffsets[this.valueOffsetCount] = valueOffset;
    this.valueOffsetCount++;
  }
}

/** Copies one byte range into a target and returns the next write offset. */
function copyByteRange(
  source: Uint8Array,
  start: number,
  end: number,
  target: Uint8Array,
  targetStart: number
): number {
  for (let byteIndex = start; byteIndex < end; byteIndex++) {
    target[targetStart] = source[byteIndex];
    targetStart++;
  }
  return targetStart;
}

/** Counts fields in a byte range that contains unquoted delimiter bytes. */
function countDelimitedFields(
  bytes: Uint8Array,
  start: number,
  end: number,
  delimiter: number
): number {
  let fieldCount = 1;
  for (let byteIndex = start; byteIndex < end; byteIndex++) {
    if (bytes[byteIndex] === delimiter) {
      fieldCount++;
    }
  }
  return fieldCount;
}

/** Creates a loaders.gl Arrow table from raw Utf8 column builders. */
function createRawArrowTable(
  headerRow: string[],
  columnBuilders: RawArrowUtf8ColumnBuilder[]
): ArrowTable {
  const schema = createUtf8Schema(headerRow);
  if (headerRow.length === 0) {
    return {
      shape: 'arrow-table',
      schema,
      data: new arrow.Table({})
    };
  }

  const arrowFields = headerRow.map(
    (columnName) => new arrow.Field(columnName, new arrow.Utf8(), true)
  );
  const arrowSchema = new arrow.Schema(arrowFields);
  const arrowDatas = columnBuilders.map((columnBuilder) => columnBuilder.finishData());
  const arrowRecordBatch = new arrow.RecordBatch(
    arrowSchema,
    arrow.makeData({
      type: new arrow.Struct(arrowSchema.fields),
      children: arrowDatas
    })
  );

  return {
    shape: 'arrow-table',
    schema,
    data: new arrow.Table([arrowRecordBatch])
  };
}

/** Creates UTF-8 column builders with a coarse input-size based data capacity. */
function createRawArrowColumnBuilders(
  headerRow: string[],
  byteLength: number
): RawArrowUtf8ColumnBuilder[] {
  const columnCount = Math.max(headerRow.length, 1);
  const initialValueCapacity = Math.max(1024, Math.ceil(byteLength / (columnCount * 8)));
  const initialDataCapacity = Math.max(4096, Math.ceil(byteLength / Math.max(headerRow.length, 1)));
  return headerRow.map(
    () => new RawArrowUtf8ColumnBuilder(initialValueCapacity, initialDataCapacity)
  );
}

/** Returns whether a byte range only contains whitespace considered empty by CSV options. */
function isEmptyByteRange(bytes: Uint8Array, start: number, end: number): boolean {
  for (let byteIndex = start; byteIndex < end; byteIndex++) {
    const byte = bytes[byteIndex];
    if (byte !== SPACE && byte !== TAB) {
      return false;
    }
  }
  return true;
}

/** Returns whether a first-row value should be treated as a Papa-style header cell. */
function isHeaderValue(value: string, dynamicTyping: boolean): boolean {
  if (!dynamicTyping) {
    return true;
  }

  const trimmedValue = value.trim();
  if (
    trimmedValue === '' ||
    trimmedValue === 'true' ||
    trimmedValue === 'false' ||
    FLOAT.test(trimmedValue) ||
    ISO_DATE.test(trimmedValue)
  ) {
    return false;
  }

  return true;
}

/** Creates a transformer that appends suffixes to repeated column names. */
function createDuplicateColumnTransformer(): (column: string) => string {
  const observedColumns = new Set<string>();
  return (columnName) => {
    let currentColumnName = columnName;
    let duplicateCounter = 1;
    while (observedColumns.has(currentColumnName)) {
      currentColumnName = `${columnName}.${duplicateCounter}`;
      duplicateCounter++;
    }
    observedColumns.add(currentColumnName);
    return currentColumnName;
  };
}

/** Generates default column names for CSV files without a header row. */
function generateHeader(columnPrefix: string, count: number = 0): string[] {
  const headers: string[] = [];
  for (let columnIndex = 0; columnIndex < count; columnIndex++) {
    headers.push(`${columnPrefix}${columnIndex + 1}`);
  }
  return headers;
}

/** Creates a loaders.gl schema with nullable Utf8 fields. */
function createUtf8Schema(headerRow: string[]): Schema {
  return {
    fields: headerRow.map((columnName) => ({name: columnName, type: 'utf8', nullable: true})),
    metadata: {
      'loaders.gl#format': 'csv',
      'loaders.gl#loader': 'CSVArrowLoader'
    }
  };
}
