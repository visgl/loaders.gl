import * as flatbuffers from 'flatbuffers';
import slice from 'slice-source';

import ColumnMeta from '../column-meta.js';

import { Header } from '../flat-geobuf/header.js';

import { Column } from '../flat-geobuf/column.js';
import { ColumnType } from '../flat-geobuf/column-type.js';
import { Feature } from '../flat-geobuf/feature.js';
import HeaderMeta, { fromByteBuffer } from '../header-meta.js';

import { buildFeature, IFeature } from './feature.js';
import { HttpReader } from '../http-reader.js';
import Logger from '../logger.js';
import { Rect, calcTreeSize } from '../packedrtree.js';
import { parseGeometry } from './geometry.js';
import { HeaderMetaFn } from '../generic.js';
import { magicbytes, SIZE_PREFIX_LEN } from '../constants.js';
import { inferGeometryType } from './header.js';

export type FromFeatureFn = (feature: Feature, header: HeaderMeta) => IFeature;
type ReadFn = (size: number, purpose: string) => Promise<ArrayBuffer>;

/**
 * Serialize generic features to FlatGeobuf
 * @param features
 */
export function serialize(features: IFeature[]): Uint8Array {
  const headerMeta = introspectHeaderMeta(features);
  const header = buildHeader(headerMeta);
  const featureBuffers: Uint8Array[] = features.map((f) => {
    if (!f.getGeometry)
      throw new Error('Missing getGeometry implementation');
    if (!f.getProperties)
      throw new Error('Missing getProperties implementation');
    return buildFeature(
      parseGeometry(f.getGeometry(), headerMeta.geometryType),
      f.getProperties(),
      headerMeta,
    );
  });
  const featuresLength = featureBuffers
    .map((f) => f.length)
    .reduce((a, b) => a + b);
  const uint8 = new Uint8Array(
    magicbytes.length + header.length + featuresLength,
  );
  uint8.set(header, magicbytes.length);
  let offset = magicbytes.length + header.length;
  for (const feature of featureBuffers) {
    uint8.set(feature, offset);
    offset += feature.length;
  }
  uint8.set(magicbytes);
  return uint8;
}

export function deserialize(
  bytes: Uint8Array,
  fromFeature: FromFeatureFn,
  headerMetaFn?: HeaderMetaFn,
): IFeature[] {
  if (!bytes.subarray(0, 3).every((v, i) => magicbytes[i] === v))
    throw new Error('Not a FlatGeobuf file');

  const bb = new flatbuffers.ByteBuffer(bytes);
  const headerLength = bb.readUint32(magicbytes.length);
  bb.setPosition(magicbytes.length + SIZE_PREFIX_LEN);

  const headerMeta = fromByteBuffer(bb);
  if (headerMetaFn) headerMetaFn(headerMeta);

  let offset = magicbytes.length + SIZE_PREFIX_LEN + headerLength;

  const { indexNodeSize, featuresCount } = headerMeta;
  if (indexNodeSize > 0) offset += calcTreeSize(featuresCount, indexNodeSize);

  const features: IFeature[] = [];
  while (offset < bb.capacity()) {
    const featureLength = bb.readUint32(offset);
    bb.setPosition(offset + SIZE_PREFIX_LEN);
    const feature = Feature.getRootAsFeature(bb);
    features.push(fromFeature(feature, headerMeta));
    offset += SIZE_PREFIX_LEN + featureLength;
  }

  return features;
}

export async function* deserializeStream(
  stream: ReadableStream,
  fromFeature: FromFeatureFn,
  headerMetaFn?: HeaderMetaFn,
): AsyncGenerator<IFeature> {
  const reader = slice(stream);
  const read: ReadFn = async (size) => await reader.slice(size);

  let bytes = new Uint8Array(await read(8, 'magic bytes'));
  if (!bytes.subarray(0, 3).every((v, i) => magicbytes[i] === v))
    throw new Error('Not a FlatGeobuf file');
  bytes = new Uint8Array(await read(4, 'header length'));
  let bb = new flatbuffers.ByteBuffer(bytes);
  const headerLength = bb.readUint32(0);
  bytes = new Uint8Array(await read(headerLength, 'header data'));
  bb = new flatbuffers.ByteBuffer(bytes);

  const headerMeta = fromByteBuffer(bb);
  if (headerMetaFn) headerMetaFn(headerMeta);

  const { indexNodeSize, featuresCount } = headerMeta;
  if (indexNodeSize > 0) {
    const treeSize = calcTreeSize(featuresCount, indexNodeSize);
    await read(treeSize, 'entire index, w/o rect');
  }
  let feature: IFeature | undefined;
  while ((feature = await readFeature(read, headerMeta, fromFeature)))
    yield feature;
}

export async function* deserializeFiltered(
  url: string,
  rect: Rect,
  fromFeature: FromFeatureFn,
  headerMetaFn?: HeaderMetaFn,
): AsyncGenerator<IFeature> {
  const reader = await HttpReader.open(url);
  Logger.debug('opened reader');
  if (headerMetaFn) headerMetaFn(reader.header);

  for await (const feature of reader.selectBbox(rect)) {
    yield fromFeature(feature, reader.header);
  }
}

async function readFeature(
  read: ReadFn,
  headerMeta: HeaderMeta,
  fromFeature: FromFeatureFn,
): Promise<IFeature | undefined> {
  let bytes = new Uint8Array(await read(4, 'feature length'));
  if (bytes.byteLength === 0) return;
  let bb = new flatbuffers.ByteBuffer(bytes);
  const featureLength = bb.readUint32(0);
  bytes = new Uint8Array(await read(featureLength, 'feature data'));
  const bytesAligned = new Uint8Array(featureLength + 4);
  bytesAligned.set(bytes, 4);
  bb = new flatbuffers.ByteBuffer(bytesAligned);
  bb.setPosition(SIZE_PREFIX_LEN);
  const feature = Feature.getRootAsFeature(bb);
  return fromFeature(feature, headerMeta);
}

function buildColumn(builder: flatbuffers.Builder, column: ColumnMeta): number {
  const nameOffset = builder.createString(column.name);
  Column.startColumn(builder);
  Column.addName(builder, nameOffset);
  Column.addType(builder, column.type);
  return Column.endColumn(builder);
}

export function buildHeader(header: HeaderMeta): Uint8Array {
  const builder = new flatbuffers.Builder();

  let columnOffsets: number | null = null;
  if (header.columns)
    columnOffsets = Header.createColumnsVector(
      builder,
      header.columns.map((c) => buildColumn(builder, c)),
    );

  const nameOffset = builder.createString('L1');

  Header.startHeader(builder);
  Header.addFeaturesCount(builder, BigInt(header.featuresCount));
  Header.addGeometryType(builder, header.geometryType);
  Header.addIndexNodeSize(builder, 0);
  if (columnOffsets) Header.addColumns(builder, columnOffsets);
  Header.addName(builder, nameOffset);
  const offset = Header.endHeader(builder);
  builder.finishSizePrefixed(offset);
  return builder.asUint8Array() ;
}

function valueToType(value: boolean | number | string): ColumnType {
  if (typeof value === 'boolean') return ColumnType.Bool;
  else if (typeof value === 'number')
    if (value % 1 === 0) return ColumnType.Int;
    else return ColumnType.Double;
  else if (typeof value === 'string') return ColumnType.String;
  else if (value === null) return ColumnType.String;
  else if (typeof value === 'object') return ColumnType.Json;
  throw new Error(`Unknown type (value '${value}')`);
}

export function mapColumn(properties: any, k: string): ColumnMeta {
  return {
    name: k,
    type: valueToType(properties[k]),
    title: null,
    description: null,
    width: -1,
    precision: -1,
    scale: -1,
    nullable: true,
    unique: false,
    primary_key: false,
  };
}

function introspectHeaderMeta(features: IFeature[]): HeaderMeta {
  const sampleFeature = features[0];
  const properties = sampleFeature.getProperties
    ? sampleFeature.getProperties()
    : {};

  let columns: ColumnMeta[] | null = null;
  if (properties)
    columns = Object.keys(properties)
      .filter((key) => key !== 'geometry')
      .map((k) => mapColumn(properties, k));

  const geometryType = inferGeometryType(features);
  const headerMeta: HeaderMeta = {
    geometryType,
    columns,
    envelope: null,
    featuresCount: features.length,
    indexNodeSize: 0,
    crs: null,
    title: null,
    description: null,
    metadata: null,
  };
  return headerMeta;
}
