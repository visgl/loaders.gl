import {Schema, Field} from '@loaders.gl/schema';
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
    fields.push({
      name: 'POSITION',
      type: {type: 'fixed-size-list', listSize: 3, children: [{name: 'xyz', type: 'float32'}]}
    });
  }

  if (offset.normal_x !== undefined) {
    fields.push({
      name: 'NORMAL',
      type: {type: 'fixed-size-list', listSize: 3, children: [{name: 'xyz', type: 'float32'}]}
    });
  }

  if (offset.rgb !== undefined) {
    fields.push({
      name: 'COLOR_0',
      type: {type: 'fixed-size-list', listSize: 3, children: [{name: 'rgb', type: 'uint8'}]}
    });
  }

  return {fields, metadata};
}
