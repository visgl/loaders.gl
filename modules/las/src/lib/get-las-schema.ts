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
function makeMetadataFromLasHeader(lasHeader: LASHeader): Map<string, string> {
  const metadataMap = new Map();
  metadataMap.set('pointsOffset', lasHeader.pointsOffset.toString(10));
  metadataMap.set('pointsFormatId', lasHeader.pointsFormatId.toString(10));
  metadataMap.set('pointsStructSize', lasHeader.pointsStructSize.toString(10));
  metadataMap.set('pointsCount', lasHeader.pointsCount.toString(10));
  metadataMap.set('scale', JSON.stringify(lasHeader.scale));
  metadataMap.set('offset', JSON.stringify(lasHeader.offset));
  if (lasHeader.maxs !== undefined) {
    metadataMap.set('maxs', JSON.stringify(lasHeader.maxs));
  }
  if (lasHeader.mins !== undefined) {
    metadataMap.set('mins', JSON.stringify(lasHeader.mins));
  }
  metadataMap.set('totalToRead', lasHeader.totalToRead.toString(10));
  metadataMap.set('pointsFortotalReadmatId', lasHeader.totalRead.toString(10));
  if (lasHeader.versionAsString !== undefined) {
    metadataMap.set('versionAsString', lasHeader.versionAsString);
  }
  if (lasHeader.isCompressed !== undefined) {
    metadataMap.set('isCompressed', lasHeader.isCompressed.toString());
  }
  return metadataMap;
}
