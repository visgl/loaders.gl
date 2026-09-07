// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ChromeTraceEventSchema, ChromeTraceFileSchema} from './chrome-trace-schema';

/**
 * Incremental tokenizer state for one streamed Chrome trace JSON file.
 */
export type ChromeTraceFileTokenizer = {
  /** Incremental UTF-8 decoder for binary source chunks. */
  textDecoder: TextDecoder;
  /** Remaining undecoded text buffer. */
  buffer: string;
  /** Whether parsing has reached the `traceEvents` array. */
  insideTraceEventsArray: boolean;
  /** Whether the trace-events array has been fully consumed. */
  traceEventsArrayFinished: boolean;
  /** Whether parsing is currently inside a JSON string literal. */
  insideString: boolean;
  /** Whether the current string parser is escaping the next character. */
  escapingCharacter: boolean;
  /** Current object depth within the trace-events array. */
  objectDepth: number;
  /** Buffer index where the current event object started, when present. */
  objectStartIndex: number | null;
  /** Optional top-level display time unit discovered from the JSON prefix. */
  displayTimeUnit?: string;
};

/**
 * Creates one incremental tokenizer for a chunked Chrome trace file.
 */
export function createChromeTraceFileTokenizer(
  displayTimeUnit: string | undefined
): ChromeTraceFileTokenizer {
  return {
    textDecoder: new TextDecoder(),
    buffer: '',
    insideTraceEventsArray: false,
    traceEventsArrayFinished: false,
    insideString: false,
    escapingCharacter: false,
    objectDepth: 0,
    objectStartIndex: null,
    displayTimeUnit
  };
}

/**
 * Appends one streamed chunk and returns any fully parsed event objects.
 */
export function appendChromeTraceFileChunk(
  tokenizer: ChromeTraceFileTokenizer,
  chunk: string | ArrayBufferLike | ArrayBufferView
): ChromeTraceEventSchema[] {
  tokenizer.buffer += decodeChromeTraceChunk(tokenizer, chunk);
  maybeExtractChromeTraceDisplayTimeUnit(tokenizer);
  return extractChromeTraceEventsFromTokenizer(tokenizer);
}

/**
 * Attempts to parse one complete Chrome trace text payload.
 */
export function tryParseChromeTraceFileText(text: string): ChromeTraceFileSchema | null {
  try {
    const parsed = JSON.parse(text) as ChromeTraceFileSchema;
    return Array.isArray(parsed?.traceEvents) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Decodes one streamed chunk into UTF-8 text.
 */
function decodeChromeTraceChunk(
  tokenizer: ChromeTraceFileTokenizer,
  chunk: string | ArrayBufferLike | ArrayBufferView
): string {
  if (typeof chunk === 'string') {
    return tokenizer.textDecoder.decode() + chunk;
  }

  if (ArrayBuffer.isView(chunk)) {
    return tokenizer.textDecoder.decode(
      new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength),
      {stream: true}
    );
  }

  return tokenizer.textDecoder.decode(new Uint8Array(chunk), {stream: true});
}

/**
 * Extracts the optional display time unit from the JSON prefix.
 */
function maybeExtractChromeTraceDisplayTimeUnit(tokenizer: ChromeTraceFileTokenizer): void {
  if (tokenizer.displayTimeUnit) {
    return;
  }

  const match = tokenizer.buffer.match(/"displayTimeUnit"\s*:\s*"([^"]+)"/);
  if (match?.[1]) {
    tokenizer.displayTimeUnit = match[1];
  }
}

/**
 * Extracts complete event objects from the tokenizer buffer.
 */
function extractChromeTraceEventsFromTokenizer(
  tokenizer: ChromeTraceFileTokenizer
): ChromeTraceEventSchema[] {
  const parsedEvents: ChromeTraceEventSchema[] = [];

  if (!tokenizer.insideTraceEventsArray) {
    if (tokenizer.traceEventsArrayFinished) {
      return parsedEvents;
    }
    const traceEventsKeyIndex = tokenizer.buffer.indexOf('"traceEvents"');
    const traceEventsArrayIndex =
      traceEventsKeyIndex >= 0 ? tokenizer.buffer.indexOf('[', traceEventsKeyIndex) : -1;

    if (traceEventsArrayIndex < 0) {
      return parsedEvents;
    }

    tokenizer.buffer = tokenizer.buffer.slice(traceEventsArrayIndex + 1);
    tokenizer.insideTraceEventsArray = true;
  }

  let trimIndex = 0;

  for (let index = 0; index < tokenizer.buffer.length; index += 1) {
    const character = tokenizer.buffer[index];

    if (tokenizer.insideString) {
      if (tokenizer.escapingCharacter) {
        tokenizer.escapingCharacter = false;
      } else if (character === '\\') {
        tokenizer.escapingCharacter = true;
      } else if (character === '"') {
        tokenizer.insideString = false;
      }
      continue;
    }

    if (character === '"') {
      tokenizer.insideString = true;
      continue;
    }

    if (tokenizer.objectStartIndex == null) {
      if (character === '{') {
        tokenizer.objectStartIndex = index;
        tokenizer.objectDepth = 1;
      } else if (character === ']') {
        trimIndex = index + 1;
        tokenizer.traceEventsArrayFinished = true;
        tokenizer.insideTraceEventsArray = false;
        break;
      }
      continue;
    }

    if (character === '{') {
      tokenizer.objectDepth += 1;
      continue;
    }

    if (character !== '}') {
      continue;
    }

    tokenizer.objectDepth -= 1;
    if (tokenizer.objectDepth !== 0) {
      continue;
    }

    const eventJson = tokenizer.buffer.slice(tokenizer.objectStartIndex, index + 1);
    parsedEvents.push(JSON.parse(eventJson) as ChromeTraceEventSchema);
    trimIndex = index + 1;
    tokenizer.objectStartIndex = null;
  }

  if (tokenizer.objectStartIndex != null) {
    tokenizer.buffer = tokenizer.buffer.slice(tokenizer.objectStartIndex);
    tokenizer.objectStartIndex = 0;
    tokenizer.objectDepth = 0;
    tokenizer.insideString = false;
    tokenizer.escapingCharacter = false;
    return parsedEvents;
  }

  if (tokenizer.traceEventsArrayFinished) {
    tokenizer.buffer = '';
    return parsedEvents;
  }

  tokenizer.buffer = tokenizer.buffer.slice(trimIndex);
  return parsedEvents;
}
