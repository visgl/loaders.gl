import BinaryAsyncIteratorReader from '../streaming/binary-async-iterator-reader';
import {parseSHPHeader} from './parse-shp';
import {parseRecord} from './parse-shp-geometry';

const BIG_ENDIAN = false;
// const LITTLE_ENDIAN = true;

const SHAPE_HEADER_SIZE = 100;
const SHAPE_RECORD_HEADER_SIZE = 8;

export default async function* parseShapeInBatches(asyncIterator) {
  const binaryReader = new BinaryAsyncIteratorReader(asyncIterator);

  const fileHeaderView = await binaryReader.getDataView(SHAPE_HEADER_SIZE);
  parseSHPHeader(fileHeaderView);
  // const fileHeader = parseSHPHeader(fileHeaderView);

  // let index = 0;
  // const shpType = fileHeader.type;
  // ++index;

  const headerView = await binaryReader.getDataView(SHAPE_RECORD_HEADER_SIZE);
  if (!headerView) {
    // Source exhausted, finished
    return;
  }

  const header = {
    recordNumber: headerView.getInt32(0, BIG_ENDIAN),
    length: headerView.getInt32(4, BIG_ENDIAN) * 2 - 4
    // type: headerView.getInt32(8, LITTLE_ENDIAN)
  };

  // All records should have at least four bytes (for the record shape type),
  // so an invalid content length indicates corruption.
  const recordView = await binaryReader.getDataView(header.length);
  if (!recordView) {
    // Source exhausted, finished
    return;
  }
  const record = parseRecord(recordView);

  yield record;

  // TODO - restore error handling
  /*
  const isInvalid = header.length < 0 || (header.type !== shpType);

  // If the record starts with an invalid shape type (see #36), scan ahead in
  // four-byte increments to find the next valid record, identified by the
  // expected index, a non-empty content length and a valid shape type.
  if (!isInvalid) {

  } else {
    /*
    const chunk = await binaryReader.getDataView(4);
    if (chunk === null) {
      return;
    }

    const array = concat(header.buffer.slice(4), chunk);
    headerView = new DataView(array)

    array = concat(array.slice(4), chunk);
    // const header = view(array));
    header.getInt32(0, false) !== that._index ? skip() : read();
  }
  */
}
