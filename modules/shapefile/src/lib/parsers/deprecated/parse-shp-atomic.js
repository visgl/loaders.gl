import BinaryReader from '../../streaming/binary-reader';
import {parseRecord} from '../parse-shp-geometry';

const LITTLE_ENDIAN = true;
const BIG_ENDIAN = false;

const SHP_MAGIC_NUMBER = 0x0000270a;
const SHP_HEADER_SIZE = 100;
// According to the spec, the record header is just 8 bytes, but here we set it
// to 12 so that we can also access the record's type
const SHP_RECORD_HEADER_SIZE = 8;

/**
 * Atomically parse a shapefile from an ArrayBuffer
 * @param {ArrayBuffer} arrayBuffer
 */
export default function parseSHP(arrayBuffer) {
  const binaryReader = new BinaryReader(arrayBuffer);

  const headerView = binaryReader.getDataView(SHP_HEADER_SIZE);
  const header = parseSHPHeader(headerView);

  // index numbering starts at 1
  let currentIndex = 1;
  const geometries = [];

  while (binaryReader.hasAvailableBytes(SHP_RECORD_HEADER_SIZE + 4)) {
    const recordHeaderView = binaryReader.getDataView(SHP_RECORD_HEADER_SIZE + 4);
    const recordHeader = {
      recordNumber: recordHeaderView.getInt32(0, BIG_ENDIAN),
      // 2 byte words; includes the four words of record header
      byteLength: recordHeaderView.getInt32(4, BIG_ENDIAN) * 2,
      // This is actually part of the record, not the header...
      type: recordHeaderView.getInt32(8, LITTLE_ENDIAN)
    };

    const invalidRecord =
      recordHeader.byteLength < 4 ||
      recordHeader.type !== header.type ||
      recordHeader.recordNumber !== currentIndex;

    // All records must have at least four bytes (for the record shape type)
    if (invalidRecord) {
      // Malformed record, try again, advancing just 4 bytes
      binaryReader.rewind(SHP_RECORD_HEADER_SIZE);
    } else {
      // Note: type is actually part of the record, not the header, so rewind 4 bytes befor reading record
      binaryReader.rewind(4);

      const recordView = binaryReader.getDataView(recordHeader.byteLength);
      geometries.push(parseRecord(recordView));
      currentIndex++;
    }
  }

  return {
    header,
    geometries
  };
}

/**
 * Extract the binary header
 * @param {DataView} headerView
 */
export function parseSHPHeader(headerView) {
  // Note: The SHP format switches endianness between fields!
  // https://www.esri.com/library/whitepapers/pdfs/shapefile.pdf
  const header = {
    magic: headerView.getInt32(0, BIG_ENDIAN),
    // Length is stored as # of 2-byte words; multiply by 2 to get # of bytes
    length: headerView.getInt32(24, BIG_ENDIAN) * 2,
    version: headerView.getInt32(28, LITTLE_ENDIAN),
    type: headerView.getInt32(32, LITTLE_ENDIAN),
    bbox: {
      minX: headerView.getFloat64(36, LITTLE_ENDIAN),
      minY: headerView.getFloat64(44, LITTLE_ENDIAN),
      minZ: headerView.getFloat64(68, LITTLE_ENDIAN),
      minM: headerView.getFloat64(84, LITTLE_ENDIAN),
      maxX: headerView.getFloat64(52, LITTLE_ENDIAN),
      maxY: headerView.getFloat64(60, LITTLE_ENDIAN),
      maxZ: headerView.getFloat64(76, LITTLE_ENDIAN),
      maxM: headerView.getFloat64(92, LITTLE_ENDIAN)
    }
  };
  if (header.magic !== SHP_MAGIC_NUMBER) {
    // eslint-disable-next-line
    console.error(`SHP file: bad magic number ${header.magic}`);
  }
  if (header.version !== 1000) {
    // eslint-disable-next-line
    console.error(`SHP file: bad version ${header.version}`);
  }
  return header;
}
