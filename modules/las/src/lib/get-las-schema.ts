import {Schema, MeshAttributes, deduceMeshSchema} from '@loaders.gl/schema';
import type {LASHeader} from './las-types';

/**
 * Gets schema from PLY header
 * @param lasHeader
 * @param metadata
 * @returns Schema
 */
export function getLASSchema(lasHeader: LASHeader, attributes: MeshAttributes): Schema {
  const metadataMap = makeMetadataFromLasHeader(lasHeader);
  const schema = deduceMeshSchema(attributes, metadataMap);
  return schema;
}

/**
 * Make arrow like schema metadata by LASHeader properties
 * @param lasHeader
 * @returns
 */
export function makeMetadataFromLasHeader(lasHeader: LASHeader): Map<string, string> {
  const metadataMap = new Map();
  metadataMap.set('las_pointsOffset', lasHeader.pointsOffset.toString(10));
  metadataMap.set('las_pointsFormatId', lasHeader.pointsFormatId.toString(10));
  metadataMap.set('las_pointsStructSize', lasHeader.pointsStructSize.toString(10));
  metadataMap.set('las_pointsCount', lasHeader.pointsCount.toString(10));
  metadataMap.set('las_scale', JSON.stringify(lasHeader.scale));
  metadataMap.set('las_offset', JSON.stringify(lasHeader.offset));
  if (lasHeader.maxs !== undefined) {
    metadataMap.set('las_maxs', JSON.stringify(lasHeader.maxs));
  }
  if (lasHeader.mins !== undefined) {
    metadataMap.set('las_mins', JSON.stringify(lasHeader.mins));
  }
  metadataMap.set('las_totalToRead', lasHeader.totalToRead.toString(10));
  metadataMap.set('las_pointsFortotalReadmatId', lasHeader.totalRead.toString(10));
  if (lasHeader.versionAsString !== undefined) {
    metadataMap.set('las_versionAsString', lasHeader.versionAsString);
  }
  if (lasHeader.isCompressed !== undefined) {
    metadataMap.set('las_isCompressed', lasHeader.isCompressed.toString());
  }
  return metadataMap;
}
