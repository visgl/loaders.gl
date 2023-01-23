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
export function makeMetadataFromLasHeader(lasHeader: LASHeader): Record<string, string> {
  const metadata: Record<string, string> = {};
  /* eslint-disable camelcase */
  metadata.las_pointsOffset = lasHeader.pointsOffset.toString(10);
  metadata.las_pointsFormatId = lasHeader.pointsFormatId.toString(10);
  metadata.las_pointsStructSize = lasHeader.pointsStructSize.toString(10);
  metadata.las_pointsCount = lasHeader.pointsCount.toString(10);
  metadata.las_scale = JSON.stringify(lasHeader.scale);
  metadata.las_offset = JSON.stringify(lasHeader.offset);
  if (lasHeader.maxs !== undefined) {
    metadata.las_maxs = JSON.stringify(lasHeader.maxs);
  }
  if (lasHeader.mins !== undefined) {
    metadata.las_mins = JSON.stringify(lasHeader.mins);
  }
  metadata.las_totalToRead = lasHeader.totalToRead.toString(10);
  metadata.las_pointsFortotalReadmatId = lasHeader.totalRead.toString(10);
  if (lasHeader.versionAsString !== undefined) {
    metadata.las_versionAsString = lasHeader.versionAsString;
  }
  if (lasHeader.isCompressed !== undefined) {
    metadata.las_isCompressed = lasHeader.isCompressed.toString();
  }
  return metadata;
}
