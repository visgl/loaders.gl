import {parseHeader, BIG_ENDIAN} from './util';
import {parseRecord} from './parse-geometry';


const SHAPE_HEADER_SIZE = 100;
// According to the spec, the record header is just 8 bytes, but here we set it
// to 12 so that we can also access the record's type
const SHAPE_RECORD_HEADER_SIZE = 12;

export default function parseShape(arrayBuffer) {
  const headerView = new DataView(arrayBuffer, 0, SHAPE_HEADER_SIZE);
  const header = parseHeader(headerView);

  // eslint-disable-next-line
  // index numbering starts at 1
  let currentIndex = 1;
  const features = [];

  let offset = SHAPE_HEADER_SIZE;

  while (offset + SHAPE_RECORD_HEADER_SIZE < arrayBuffer.byteLength) {
    const recordHeaderView = new DataView(arrayBuffer, offset, SHAPE_RECORD_HEADER_SIZE);
    // Numbering starts at 1
    // eslint-disable-next-line
    const recordNumber = recordHeaderView.getInt32(0, BIG_ENDIAN);
    // 2 byte words; includes the four words of record header
    const byteLength = recordHeaderView.getInt32(4, BIG_ENDIAN) * 2;
    const type = recordHeaderView.getInt32(8, true);

    // All records must have at least four bytes (for the record shape type)
    if (byteLength < 4 || type !== header.type || recordNumber !== currentIndex) {
      // Malformed record, try again after advancing 4 bytes
      offset += 4;
    } else {
      // Move past header
      // type is actually part of the record, not the header, so only increase
      // offset past recordNumber and byteLength
      offset += Int32Array.BYTES_PER_ELEMENT * 2;

      const recordView = new DataView(arrayBuffer, offset, byteLength);
      features.push(parseRecord(recordView));
      currentIndex++;
      offset += byteLength;
    }
  }

  return {
    header,
    features
  };
}
