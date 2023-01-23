import {Schema, MeshAttributes, deduceMeshSchema} from '@loaders.gl/schema';
import type {PLYHeader} from './ply-types';

/**
 * Gets schema from PLY header
 * @param plyHeader
 * @param metadata
 * @returns Schema
 */
export function getPLYSchema(plyHeader: PLYHeader, attributes: MeshAttributes): Schema {
  const metadata = makeMetadataFromPlyHeader(plyHeader);
  const schema = deduceMeshSchema(attributes, metadata);
  return schema;
}

/**
 * Make arrow like schema metadata by PlyHeader properties
 * @param plyHeader
 * @returns
 */
function makeMetadataFromPlyHeader(plyHeader: PLYHeader): Record<string, string> {
  /* eslint-disable camelcase */
  const metadata: Record<string, string> = {};
  metadata.ply_comments = JSON.stringify(plyHeader.comments);
  metadata.ply_elements = JSON.stringify(plyHeader.elements);
  if (plyHeader.format !== undefined) {
    metadata.ply_format = plyHeader.format;
  }
  if (plyHeader.version !== undefined) {
    metadata.ply_version = plyHeader.version;
  }
  if (plyHeader.headerLength !== undefined) {
    metadata.ply_headerLength = plyHeader.headerLength.toString(10);
  }
  return metadata;
}
