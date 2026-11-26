// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** A CSV field's quoting state across ZIP chunk boundaries. */
type FieldState = 'start' | 'bare' | 'quoted' | 'closed';

/** UTF-16 code unit for a double quote. */
const QUOTE = 34;
/** UTF-16 code unit for a comma. */
const COMMA = 44;
/** UTF-16 code unit for a carriage return. */
const CARRIAGE_RETURN = 13;
/** UTF-16 code unit for a line feed. */
const LINE_FEED = 10;

/** Reads GTFS CSV records from UTF-8 chunks, holding only one incomplete record. */
export async function* readGTFSCSVRecords(
  chunks: AsyncIterable<Uint8Array>,
  fileName = 'CSV input'
): AsyncGenerator<string[]> {
  let fields: string[] = [];
  let value = '';
  let state: FieldState = 'start';
  let skipLineFeed = false;
  let recordNumber = 1;

  for await (const text of decodeText(chunks)) {
    let position = 0;
    while (position < text.length) {
      if (skipLineFeed) {
        skipLineFeed = false;
        if (text.charCodeAt(position) === LINE_FEED) {
          position++;
          continue;
        }
      }
      if (state === 'quoted') {
        const quote = text.indexOf('"', position);
        if (quote === -1) {
          value += text.slice(position);
          break;
        }
        value += text.slice(position, quote);
        state = 'closed';
        position = quote + 1;
        continue;
      }

      const character = text.charCodeAt(position);
      if (character === QUOTE && state !== 'bare') {
        if (state === 'closed') value += '"';
        state = 'quoted';
        position++;
      } else if (character === COMMA) {
        fields.push(value);
        value = '';
        state = 'start';
        position++;
      } else if (character === CARRIAGE_RETURN || character === LINE_FEED) {
        const hasRecord = fields.length > 0 || state !== 'start';
        const record = fields;
        fields = [];
        state = 'start';
        skipLineFeed = character === CARRIAGE_RETURN;
        position++;
        if (hasRecord) {
          record.push(value);
          yield record;
          recordNumber++;
        }
        value = '';
      } else {
        if (state === 'closed') {
          throw new Error(
            `Unexpected character after quoted GTFS CSV field in ${fileName} record ${recordNumber}`
          );
        }
        const start = position++;
        // Quotes inside a bare field are literal. Only delimiters can end this run.
        while (position < text.length) {
          const code = text.charCodeAt(position);
          if (code === COMMA || code === CARRIAGE_RETURN || code === LINE_FEED) break;
          position++;
        }
        value += text.slice(start, position);
        state = 'bare';
      }
    }
  }

  if (state === 'quoted') {
    throw new Error(`Unterminated quoted GTFS CSV field in ${fileName} record ${recordNumber}`);
  }
  if (fields.length || state !== 'start') {
    fields.push(value);
    yield fields;
  }
}

/** Decodes UTF-8 incrementally, including a split BOM or multibyte character. */
async function* decodeText(chunks: AsyncIterable<Uint8Array>): AsyncGenerator<string> {
  const decoder = new TextDecoder('utf-8', {fatal: true});
  for await (const chunk of chunks) {
    yield decoder.decode(chunk, {stream: true});
  }
  yield decoder.decode();
}
