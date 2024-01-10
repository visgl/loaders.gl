import * as flatbuffers from 'flatbuffers';

import ColumnMeta from '../column-meta.js';
import {ColumnType} from '../flat-geobuf/column-type.js';
import {Feature} from '../flat-geobuf/feature.js';
import HeaderMeta from '../header-meta.js';
import {buildGeometry, ISimpleGeometry, ICreateGeometry, IParsedGeometry} from './geometry.js';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export interface IFeature {
  getGeometry?(): ISimpleGeometry;
  getProperties?(): any;
  setProperties?(properties: Record<string, unknown>): any;
}

export interface ICreateFeature {
  (geometry?: ISimpleGeometry, properties?: Record<string, unknown>): IFeature;
}

export interface IProperties {
  [key: string]: boolean | number | string | any;
}

export function fromFeature(
  feature: Feature,
  header: HeaderMeta,
  createGeometry: ICreateGeometry,
  createFeature: ICreateFeature
): IFeature {
  const columns = header.columns;
  const geometry = feature.geometry();
  const simpleGeometry = createGeometry(geometry, header.geometryType);
  const properties = parseProperties(feature, columns as ColumnMeta[]);
  return createFeature(simpleGeometry, properties);
}

export function buildFeature(
  geometry: IParsedGeometry,
  properties: IProperties,
  header: HeaderMeta
): Uint8Array {
  const columns = header.columns;
  const builder = new flatbuffers.Builder();

  let offset = 0;
  let capacity = 1024;
  let bytes = new Uint8Array(capacity);
  let view = new DataView(bytes.buffer);

  const prep = function (size: number) {
    if (offset + size < capacity) return;
    capacity = Math.max(capacity + size, capacity * 2);
    const newBytes = new Uint8Array(capacity);
    newBytes.set(bytes);
    bytes = newBytes;
    view = new DataView(bytes.buffer);
  };

  if (columns) {
    for (let i = 0; i < columns.length; i++) {
      const column = columns[i];
      const value = properties[column.name];
      if (value === null) continue;
      prep(2);
      view.setUint16(offset, i, true);
      offset += 2;
      switch (column.type) {
        case ColumnType.Bool:
          prep(1);
          view.setUint8(offset, value as number);
          offset += 1;
          break;
        case ColumnType.Short:
          prep(2);
          view.setInt16(offset, value as number, true);
          offset += 2;
          break;
        case ColumnType.UShort:
          prep(2);
          view.setUint16(offset, value as number, true);
          offset += 2;
          break;
        case ColumnType.Int:
          prep(4);
          view.setInt32(offset, value as number, true);
          offset += 4;
          break;
        case ColumnType.UInt:
          prep(4);
          view.setUint32(offset, value as number, true);
          offset += 4;
          break;
        case ColumnType.Long:
          prep(8);
          view.setBigInt64(offset, BigInt(value), true);
          offset += 8;
          break;
        case ColumnType.Float:
          prep(4);
          view.setFloat32(offset, value as number, true);
          offset += 4;
          break;
        case ColumnType.Double:
          prep(8);
          view.setFloat64(offset, value as number, true);
          offset += 8;
          break;
        case ColumnType.DateTime:
        case ColumnType.String: {
          const str = textEncoder.encode(value);
          prep(4);
          view.setUint32(offset, str.length, true);
          offset += 4;
          prep(str.length);
          bytes.set(str, offset);
          offset += str.length;
          break;
        }
        case ColumnType.Json: {
          const str = textEncoder.encode(JSON.stringify(value));
          prep(4);
          view.setUint32(offset, str.length, true);
          offset += 4;
          prep(str.length);
          bytes.set(str, offset);
          offset += str.length;
          break;
        }
        default:
          throw new Error(`Unknown type ${column.type}`);
      }
    }
  }

  let propertiesOffset: number | null = null;
  if (offset > 0)
    propertiesOffset = Feature.createPropertiesVector(builder, bytes.slice(0, offset));

  const geometryOffset = buildGeometry(builder, geometry);
  Feature.startFeature(builder);
  Feature.addGeometry(builder, geometryOffset);
  if (propertiesOffset) Feature.addProperties(builder, propertiesOffset);
  const featureOffset = Feature.endFeature(builder);
  builder.finishSizePrefixed(featureOffset);
  return builder.asUint8Array();
}

export function parseProperties(
  feature: Feature,
  columns?: ColumnMeta[] | null
): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  if (!columns || columns.length === 0) return properties;
  const array = feature.propertiesArray();
  if (!array) return properties;
  const view = new DataView(array.buffer, array.byteOffset);
  const length = feature.propertiesLength();
  let offset = 0;
  while (offset < length) {
    const i = view.getUint16(offset, true);
    offset += 2;
    const column = columns[i];
    const name = column.name;
    switch (column.type) {
      case ColumnType.Bool: {
        properties[name] = Boolean(view.getUint8(offset));
        offset += 1;
        break;
      }
      case ColumnType.Byte: {
        properties[name] = view.getInt8(offset);
        offset += 1;
        break;
      }
      case ColumnType.UByte: {
        properties[name] = view.getUint8(offset);
        offset += 1;
        break;
      }
      case ColumnType.Short: {
        properties[name] = view.getInt16(offset, true);
        offset += 2;
        break;
      }
      case ColumnType.UShort: {
        properties[name] = view.getUint16(offset, true);
        offset += 2;
        break;
      }
      case ColumnType.Int: {
        properties[name] = view.getInt32(offset, true);
        offset += 4;
        break;
      }
      case ColumnType.UInt: {
        properties[name] = view.getUint32(offset, true);
        offset += 4;
        break;
      }
      case ColumnType.Long: {
        properties[name] = Number(view.getBigInt64(offset, true));
        offset += 8;
        break;
      }
      case ColumnType.ULong: {
        properties[name] = Number(view.getBigUint64(offset, true));
        offset += 8;
        break;
      }
      case ColumnType.Float: {
        properties[name] = view.getFloat32(offset, true);
        offset += 4;
        break;
      }
      case ColumnType.Double: {
        properties[name] = view.getFloat64(offset, true);
        offset += 8;
        break;
      }
      case ColumnType.DateTime:
      case ColumnType.String: {
        const length = view.getUint32(offset, true);
        offset += 4;
        properties[name] = textDecoder.decode(array.subarray(offset, offset + length));
        offset += length;
        break;
      }
      case ColumnType.Json: {
        const length = view.getUint32(offset, true);
        offset += 4;
        const str = textDecoder.decode(array.subarray(offset, offset + length));
        properties[name] = JSON.parse(str);
        offset += length;
        break;
      }
      default:
        throw new Error(`Unknown type ${column.type}`);
    }
  }
  return properties;
}
