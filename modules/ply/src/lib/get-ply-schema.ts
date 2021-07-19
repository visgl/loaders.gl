// import {Schema, Field, Float32, Uint8, FixedSizeList, MeshAttributes} from '@loaders.gl/schema';
import {Schema, Field, MeshAttributes} from '@loaders.gl/schema';
import type {PLYHeader} from './ply-types';

/**
 * Gets schema from PLY header
 * @param plyHeader
 * @param metadata
 * @returns Schema
 */
export function getPLYSchema(plyHeader: PLYHeader, attributes: MeshAttributes): Schema {
  const fields: Field[] = [];

  // if (offset.x !== undefined) {
  //   fields.push(
  //     new Field('POSITION', new FixedSizeList(3, new Field('xyz', new Float32())), false)
  //   );
  // }

  // if (offset.normal_x !== undefined) {
  //   fields.push(new Field('NORMAL', new FixedSizeList(3, new Field('xyz', new Float32())), false));
  // }

  // if (offset.rgb !== undefined) {
  //   fields.push(new Field('COLOR_0', new FixedSizeList(3, new Field('rgb', new Uint8())), false));
  // }

  return new Schema(fields);
}
