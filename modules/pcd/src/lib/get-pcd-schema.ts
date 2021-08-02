import {Schema, Field, Float32, Uint8, FixedSizeList} from '@loaders.gl/schema';
import type {PCDHeader} from './pcd-types';

type SchemaMetadata = Map<string, any>;

/**
 * Gets schema from PCD header
 * @param PCDheader
 * @param metadata
 * @returns Schema
 */
export function getPCDSchema(PCDheader: PCDHeader, metadata: SchemaMetadata): Schema {
  const offset = PCDheader.offset;

  const fields: Field[] = [];

  if (offset.x !== undefined) {
    fields.push(
      new Field('POSITION', new FixedSizeList(3, new Field('xyz', new Float32())), false)
    );
  }

  if (offset.normal_x !== undefined) {
    fields.push(new Field('NORMAL', new FixedSizeList(3, new Field('xyz', new Float32())), false));
  }

  if (offset.rgb !== undefined) {
    fields.push(new Field('COLOR_0', new FixedSizeList(3, new Field('rgb', new Uint8())), false));
  }

  return new Schema(fields, metadata);
}
