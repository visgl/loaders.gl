import {parseRecord} from './parse-geometry';

const LITTLE_ENDIAN = true;
const BIG_ENDIAN = false;
const SHAPE_HEADER_SIZE = 100;
// According to the spec, the record header is just 8 bytes, but here we set it
// to 12 so that we can also access the record's type
const SHAPE_RECORD_HEADER_SIZE = 12;

export default function parseShape(arrayBuffer) {
  const headerView = new DataView(arrayBuffer, 0, SHAPE_HEADER_SIZE);
  const header = parseHeader(headerView);

  // index numbering starts at 1
  let currentIndex = 1;
  const geometries = [];

  let offset = SHAPE_HEADER_SIZE;

  while (offset + SHAPE_RECORD_HEADER_SIZE < arrayBuffer.byteLength) {
    const recordHeaderView = new DataView(arrayBuffer, offset, SHAPE_RECORD_HEADER_SIZE);
    const recordNumber = recordHeaderView.getInt32(0, BIG_ENDIAN);
    // 2 byte words; includes the four words of record header
    const byteLength = recordHeaderView.getInt32(4, BIG_ENDIAN) * 2;
    const type = recordHeaderView.getInt32(8, LITTLE_ENDIAN);

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
      geometries.push(parseRecord(recordView));
      currentIndex++;
      offset += byteLength;
    }
  }

  return {
    header,
    geometries
  };
}

export function parseHeader(header) {
  return {
    // Length is stored as # of 2-byte words; multiply by 2 to get # of bytes
    length: header.getInt32(24, BIG_ENDIAN) * 2,
    type: header.getInt32(32, LITTLE_ENDIAN),
    bbox: {
      minX: header.getFloat64(36, LITTLE_ENDIAN),
      minY: header.getFloat64(44, LITTLE_ENDIAN),
      minZ: header.getFloat64(68, LITTLE_ENDIAN),
      minM: header.getFloat64(84, LITTLE_ENDIAN),
      maxX: header.getFloat64(52, LITTLE_ENDIAN),
      maxY: header.getFloat64(60, LITTLE_ENDIAN),
      maxZ: header.getFloat64(76, LITTLE_ENDIAN),
      maxM: header.getFloat64(92, LITTLE_ENDIAN)
    }
  };
}
