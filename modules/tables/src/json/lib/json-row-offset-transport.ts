// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ObjectRowTableBatch} from '@loaders.gl/core/schema';

/** One batch of object rows framed as original input bytes and relative byte ranges. */
type JSONRowOffsetBatch = {
  /** Identifies byte-range transport on the worker boundary. */
  transport: 'json-row-offsets';
  /** Marks the frame as a data batch for the shared worker progress reporter. */
  batchType: 'data';
  /** Count of complete object rows in the frame. */
  length: number;
  /** Zero-based batch index. */
  count: number;
  /** Offset just past the last returned object row in the input. */
  bytesUsed: number;
  /** Original bytes from the first through last object, including original separators. */
  data: Uint8Array;
  /** Packed inclusive start and exclusive end offsets relative to data. */
  offsets: Uint32Array;
};

/** A retained fragment of the original input. */
type InputChunk = {
  /** Offset of the fragment in the input. */
  start: number;
  /** UTF-8 bytes supplied by the input iterator. */
  data: Uint8Array;
};

/** Decodes original row bytes and rejects malformed UTF-8. */
const decoder = new TextDecoder('utf-8', {fatal: true});

/** Byte that opens or closes a JSON string. */
const QUOTE = 0x22;
/** Byte separating objects in the top-level array. */
const COMMA = 0x2c;
/** Byte that opens a JSON array. */
const OPEN_ARRAY = 0x5b;
/** Byte that closes a JSON array. */
const CLOSE_ARRAY = 0x5d;
/** Byte that escapes the next character inside a JSON string. */
const BACKSLASH = 0x5c;
/** Byte that opens a JSON object. */
const OPEN_OBJECT = 0x7b;
/** Byte that closes a JSON object. */
const CLOSE_OBJECT = 0x7d;

/** Identifies byte-range frames without inspecting or parsing the returned rows. */
export function isJSONRowOffsetBatch(batch: unknown): batch is JSONRowOffsetBatch {
  const frame = batch as Partial<JSONRowOffsetBatch> | null;
  return frame?.transport === 'json-row-offsets';
}

/** Materializes object rows on the caller without re-encoding the original JSON. */
export function deserializeJSONRowOffsetBatch(frame: JSONRowOffsetBatch): ObjectRowTableBatch {
  const {count, bytesUsed, length, offsets} = frame;
  const bytes = frame.data.subarray(offsets[0], offsets[offsets.length - 1]);
  const data = JSON.parse('[' + decoder.decode(bytes) + ']');
  return {
    shape: 'object-row-table',
    batchType: 'data',
    count,
    bytesUsed,
    length,
    data,
    jsonpath: '$'
  };
}

/** Frames a top-level array of objects incrementally without decoding fields in the worker. */
export async function* parseJSONRowOffsetsInBatches(
  input:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  batchSize: number | 'auto' = 'auto'
): AsyncIterable<JSONRowOffsetBatch> {
  const scanner = new JSONRowOffsetScanner();
  /** Input fragments still referenced by the current batch or partial row. */
  const chunks: InputChunk[] = [];
  /** Absolute start/end pairs for complete rows waiting to be emitted. */
  let ranges: number[] = [];
  let count = 0;

  for await (const chunk of input) {
    const data = ArrayBuffer.isView(chunk)
      ? new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength)
      : new Uint8Array(chunk);
    chunks.push({start: scanner.position, data});
    for (const [start, end] of scanner.scan(data)) {
      ranges.push(start, end);
      if (batchSize !== 'auto' && ranges.length / 2 >= batchSize) yield takeBatch();
    }
    if (batchSize === 'auto' && ranges.length) yield takeBatch();

    const retainFrom = ranges[0] ?? scanner.partialRowStart ?? scanner.position;
    const retainedIndex = chunks.findIndex(
      ({start, data: bytes}) => start + bytes.length > retainFrom
    );
    chunks.splice(0, retainedIndex < 0 ? chunks.length : retainedIndex);
  }
  scanner.finish();
  if (ranges.length) yield takeBatch();

  /** Copies one contiguous frame into owned storage for transfer to the caller. */
  function takeBatch(): JSONRowOffsetBatch {
    const start = ranges[0];
    const end = ranges[ranges.length - 1];
    if (end - start > 0xffffffff) throw new RangeError('JSON worker row batch exceeds 4 GiB');
    const data = new Uint8Array(end - start);
    for (const chunk of chunks) {
      const from = Math.max(start, chunk.start);
      const to = Math.min(end, chunk.start + chunk.data.length);
      if (from < to)
        data.set(chunk.data.subarray(from - chunk.start, to - chunk.start), from - start);
      if (to === end) break;
    }
    const offsets = Uint32Array.from(ranges, offset => offset - start);
    ranges = [];
    return {
      transport: 'json-row-offsets',
      batchType: 'data',
      count: count++,
      bytesUsed: end,
      length: offsets.length / 2,
      data,
      offsets
    };
  }
}

/** Tracks top-level object boundaries across arbitrary UTF-8 chunks. */
class JSONRowOffsetScanner {
  /** Offset immediately after the bytes consumed so far. */
  position = 0;
  /** Offset of the incomplete object, if there is one. */
  partialRowStart: number | undefined;
  /** Position in the top-level array grammar. */
  private state: 'start' | 'first-row' | 'row' | 'separator' | 'end' = 'start';
  /** Nesting depth inside an object row. */
  private depth = 0;
  /** Whether the scanner is inside a quoted string. */
  private inString = false;
  /** Whether the previous string byte escapes the next byte. */
  private escaped = false;
  /** Remaining byte count when the input begins with a UTF-8 byte order mark. */
  private bomBytes = 0;

  /** Yields complete half-open object ranges discovered in this fragment. */
  *scan(chunk: Uint8Array): Iterable<[number, number]> {
    for (const byte of chunk) {
      const position = this.position++;
      if (this.partialRowStart !== undefined) {
        if (this.consumeRowByte(byte)) {
          const start = this.partialRowStart;
          this.partialRowStart = undefined;
          this.state = 'separator';
          yield [start, this.position];
        }
      } else if (position === 0 && byte === 0xef) {
        this.bomBytes = 2;
      } else if (this.bomBytes) {
        const expected = this.bomBytes === 2 ? 0xbb : 0xbf;
        if (byte !== expected) throw new SyntaxError('Invalid UTF-8 prefix in JSON input');
        this.bomBytes--;
      } else if (byte !== 32 && byte !== 9 && byte !== 10 && byte !== 13) {
        this.consumeArrayByte(byte, position);
      }
    }
  }

  /** Rejects truncated arrays or incomplete rows. */
  finish(): void {
    if (this.state !== 'end') throw new SyntaxError('Unexpected end of streamed JSON row array');
  }

  /** Handles structural bytes between objects. */
  private consumeArrayByte(byte: number, position: number): void {
    if (this.state === 'start' && byte === OPEN_ARRAY) {
      this.state = 'first-row';
    } else if ((this.state === 'first-row' || this.state === 'row') && byte === OPEN_OBJECT) {
      this.partialRowStart = position;
      this.depth = 1;
    } else if (this.state === 'separator' && byte === COMMA) {
      this.state = 'row';
    } else if ((this.state === 'first-row' || this.state === 'separator') && byte === CLOSE_ARRAY) {
      this.state = 'end';
    } else {
      throw new SyntaxError('JSON worker row offsets require a top-level array of objects');
    }
  }

  /** Skips quoted and nested bytes and signals when the top-level object closes. */
  private consumeRowByte(byte: number): boolean {
    if (this.inString) {
      if (this.escaped) this.escaped = false;
      else if (byte === BACKSLASH) this.escaped = true;
      else if (byte === QUOTE) this.inString = false;
    } else if (byte === QUOTE) {
      this.inString = true;
    } else if (byte === OPEN_OBJECT || byte === OPEN_ARRAY) {
      this.depth++;
    } else if ((byte === CLOSE_OBJECT || byte === CLOSE_ARRAY) && --this.depth === 0) {
      if (byte !== CLOSE_OBJECT) throw new SyntaxError('Expected a JSON object row');
      return true;
    }
    return false;
  }
}
