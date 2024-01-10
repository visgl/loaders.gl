import * as flatbuffers from 'flatbuffers';

import ColumnMeta from './column-meta.js';
import CrsMeta from './crs-meta.js';
import { GeometryType } from './flat-geobuf/geometry-type.js';
import { Header } from './flat-geobuf/header.js';

export default interface HeaderMeta {
    geometryType: GeometryType;
    columns: ColumnMeta[] | null;
    envelope: Float64Array | null;
    featuresCount: number;
    indexNodeSize: number;
    crs: CrsMeta | null;
    title: string | null;
    description: string | null;
    metadata: string | null;
}

export function fromByteBuffer(bb: flatbuffers.ByteBuffer): HeaderMeta {
  const header = Header.getRootAsHeader(bb);
  const featuresCount = header.featuresCount();
  const indexNodeSize = header.indexNodeSize();

  const columns: ColumnMeta[] = [];
  for (let j = 0; j < header.columnsLength(); j++) {
    const column = header.columns(j);
    if (!column) throw new Error('Column unexpectedly missing');
    if (!column.name()) throw new Error('Column name unexpectedly missing');
    columns.push({
      name: column.name() as string,
      type: column.type(),
      title: column.title(),
      description: column.description(),
      width: column.width(),
      precision: column.precision(),
      scale: column.scale(),
      nullable: column.nullable(),
      unique: column.unique(),
      primary_key: column.primaryKey(),
    });
  }
  const crs = header.crs();
  const crsMeta: CrsMeta | null = crs
    ? {
      org: crs.org(),
      code: crs.code(),
      name: crs.name(),
      description: crs.description(),
      wkt: crs.wkt(),
      code_string: crs.codeString(),
    }
    : null;
  const headerMeta: HeaderMeta = {
    geometryType: header.geometryType(),
    columns,
    envelope: null,
    featuresCount: Number(featuresCount),
    indexNodeSize,
    crs: crsMeta,
    title: header.title(),
    description: header.description(),
    metadata: header.metadata(),
  };
  return headerMeta;
}
