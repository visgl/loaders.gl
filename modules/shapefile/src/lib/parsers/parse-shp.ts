import {BinaryGeometryData} from '@loaders.gl/gis';
import BinaryChunkReader from '../streaming/binary-chunk-reader';
import {parseSHPHeader} from './parse-shp-header';
import {parseRecord} from './parse-shp-geometry';

const LITTLE_ENDIAN = true;
const BIG_ENDIAN = false;

const SHP_HEADER_SIZE = 100;
// According to the spec, the record header is just 8 bytes, but here we set it
// to 12 so that we can also access the record's type
const SHP_RECORD_HEADER_SIZE = 12;

const STATE = {
  EXPECTING_HEADER: 0,
  EXPECTING_RECORD: 1,
  END: 2,
  ERROR: 3
};

type SHPResult = {
  geometries: [];
  header?;
  error?: string;
};

class SHPParser {
  options;
  binaryReader = new BinaryChunkReader({maxRewindBytes: SHP_RECORD_HEADER_SIZE});
  state = STATE.EXPECTING_HEADER;
  result: SHPResult = {
    geometries: []
  };

  constructor(options) {
    this.options = options;
  }

  write(arrayBuffer) {
    this.binaryReader.write(arrayBuffer);
    this.state = parseState(this.state, this.result, this.binaryReader, this.options);
  }

  end() {
    this.binaryReader.end();
    this.state = parseState(this.state, this.result, this.binaryReader, this.options);
    // this.result.progress.bytesUsed = this.binaryReader.bytesUsed();
    if (this.state !== STATE.END) {
      this.state = STATE.ERROR;
      this.result.error = 'SHP incomplete file';
    }
  }
}

export function parseSHP(arrayBuffer: ArrayBuffer, options?: object): BinaryGeometryData[] {
  const shpParser = new SHPParser(options);
  shpParser.write(arrayBuffer);
  shpParser.end();

  // @ts-ignore
  return shpParser.result;
}

export async function* parseSHPInBatches(
  asyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>,
  options?: object
): AsyncIterable<BinaryGeometryData | object> {
  const parser = new SHPParser(options);
  let headerReturned = false;
  for await (const arrayBuffer of asyncIterator) {
    parser.write(arrayBuffer);
    if (!headerReturned && parser.result.header) {
      headerReturned = true;
      yield parser.result.header;
    }

    if (parser.result.geometries.length > 0) {
      yield parser.result.geometries;
      parser.result.geometries = [];
    }
  }
  parser.end();
  if (parser.result.geometries.length > 0) {
    yield parser.result.geometries;
  }

  return;
}

/**
 * State-machine parser for SHP data
 *
 * Note that whenever more data is needed, a `return`, not a `break`, is
 * necessary, as the `break` keeps the context within `parseState`, while
 * `return` releases context so that more data can be written into the
 * BinaryChunkReader.
 *
 * @param  {Number} state Current state
 * @param  {Object} result  An object to hold result data
 * @param  {BinaryChunkReader} binaryReader
 * @return {Number} State at end of current parsing
 */
/* eslint-disable complexity, max-depth */
function parseState(state, result, binaryReader, options) {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      switch (state) {
        case STATE.ERROR:
        case STATE.END:
          return state;

        case STATE.EXPECTING_HEADER:
          // Parse initial file header
          const dataView = binaryReader.getDataView(SHP_HEADER_SIZE);
          if (!dataView) {
            return state;
          }

          result.header = parseSHPHeader(dataView);
          result.progress = {
            bytesUsed: 0,
            bytesTotal: result.header.length,
            rows: 0
          };
          // index numbering starts at 1
          result.currentIndex = 1;
          state = STATE.EXPECTING_RECORD;
          break;

        case STATE.EXPECTING_RECORD:
          while (binaryReader.hasAvailableBytes(SHP_RECORD_HEADER_SIZE)) {
            const recordHeaderView = binaryReader.getDataView(SHP_RECORD_HEADER_SIZE);
            const recordHeader = {
              recordNumber: recordHeaderView.getInt32(0, BIG_ENDIAN),
              // 2 byte words; includes the four words of record header
              byteLength: recordHeaderView.getInt32(4, BIG_ENDIAN) * 2,
              // This is actually part of the record, not the header...
              type: recordHeaderView.getInt32(8, LITTLE_ENDIAN)
            };

            if (!binaryReader.hasAvailableBytes(recordHeader.byteLength - 4)) {
              binaryReader.rewind(SHP_RECORD_HEADER_SIZE);
              return state;
            }

            const invalidRecord =
              recordHeader.byteLength < 4 ||
              recordHeader.type !== result.header.type ||
              recordHeader.recordNumber !== result.currentIndex;

            // All records must have at least four bytes (for the record shape type)
            if (invalidRecord) {
              // Malformed record, try again, advancing just 4 bytes
              // Note: this is a rewind because binaryReader.getDataView above
              // moved the pointer forward 12 bytes, so rewinding 8 bytes still
              // leaves us 4 bytes ahead
              binaryReader.rewind(SHP_RECORD_HEADER_SIZE - 4);
            } else {
              // Note: type is actually part of the record, not the header, so
              // rewind 4 bytes before reading record
              binaryReader.rewind(4);

              const recordView = binaryReader.getDataView(recordHeader.byteLength);
              const geometry = parseRecord(recordView, options);
              result.geometries.push(geometry);

              result.currentIndex++;
              result.progress.rows = result.currentIndex - 1;
            }
          }

          if (binaryReader.ended) {
            state = STATE.END;
          }

          return state;

        default:
          state = STATE.ERROR;
          result.error = `illegal parser state ${state}`;
          return state;
      }
    } catch (error) {
      state = STATE.ERROR;
      result.error = `SHP parsing failed: ${(error as Error)?.message}`;
      return state;
    }
  }
}
