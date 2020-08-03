/* global TextDecoder */

// Eventually will be re-exported from generic module, hopefully
const ColumnType = {
  Byte: 0,
  UByte: 1,
  Bool: 2,
  Short: 3,
  UShort: 4,
  Int: 5,
  UInt: 6,
  Long: 7,
  ULong: 8,
  Float: 9,
  Double: 10,
  String: 11,
  Json: 12,
  DateTime: 13,
  Binary: 14
};

const textDecoder = new TextDecoder();

/* eslint-disable */
// Copied from https://github.com/bjornharrtell/flatgeobuf/blob/170a59153fe19cbf163fc296c75cf132461a456f/src/ts/generic/feature.ts#L103-L179
export function parseProperties(feature, columns) {
  if (!columns || columns.length === 0) {
    return;
  }

  const array = feature.propertiesArray();
  const view = new DataView(array.buffer, array.byteOffset);
  const length = feature.propertiesLength();
  let offset = 0;
  const properties = {};
  while (offset < length) {
    const i = view.getUint16(offset, true);
    offset += 2;
    const column = columns[i];
    switch (column.type) {
      case ColumnType.Bool: {
        properties[column.name] = !!view.getUint8(offset);
        offset += 1;
        break;
      }
      case ColumnType.Byte: {
        properties[column.name] = view.getInt8(offset);
        offset += 1;
        break;
      }
      case ColumnType.UByte: {
        properties[column.name] = view.getUint8(offset);
        offset += 1;
        break;
      }
      case ColumnType.Short: {
        properties[column.name] = view.getInt16(offset, true);
        offset += 2;
        break;
      }
      case ColumnType.UShort: {
        properties[column.name] = view.getUint16(offset, true);
        offset += 2;
        break;
      }
      case ColumnType.Int: {
        properties[column.name] = view.getInt32(offset, true);
        offset += 4;
        break;
      }
      case ColumnType.UInt: {
        properties[column.name] = view.getUint32(offset, true);
        offset += 4;
        break;
      }
      case ColumnType.Long: {
        properties[column.name] = Number(view.getBigInt64(offset, true));
        offset += 8;
        break;
      }
      case ColumnType.ULong: {
        properties[column.name] = Number(view.getBigUint64(offset, true));
        offset += 8;
        break;
      }
      case ColumnType.Double: {
        properties[column.name] = view.getFloat64(offset, true);
        offset += 8;
        break;
      }
      case ColumnType.DateTime:
      case ColumnType.String: {
        const length = view.getUint32(offset, true);
        offset += 4;
        properties[column.name] = textDecoder.decode(array.subarray(offset, offset + length));
        offset += length;
        break;
      }
      default:
        throw new Error('Unknown type ' + column.type);
    }
  }
  return properties;
}
