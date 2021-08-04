import {Schema, MeshAttributes, deduceMeshSchema} from '@loaders.gl/schema';
import type {PLYHeader} from './ply-types';

/**
 * Gets schema from PLY header
 * @param plyHeader
 * @param metadata
 * @returns Schema
 */
export function getPLYSchema(plyHeader: PLYHeader, attributes: MeshAttributes): Schema {
  const metadataMap = makeMetadataFromPlyHeader(plyHeader);
  const schema = deduceMeshSchema(attributes, metadataMap);
  return schema;
}

/**
 * Make arrow like schema metadata by PlyHeader properties
 * @param plyHeader
 * @returns
 */
function makeMetadataFromPlyHeader(plyHeader: PLYHeader): Map<string, string> {
  const metadataMap = new Map();
  metadataMap.set('comments', JSON.stringify(plyHeader.comments));
  metadataMap.set('elements', JSON.stringify(plyHeader.elements));
  if (plyHeader.format !== undefined) {
    metadataMap.set('format', plyHeader.format);
  }
  if (plyHeader.version !== undefined) {
    metadataMap.set('version', plyHeader.version);
  }
  if (plyHeader.headerLength !== undefined) {
    metadataMap.set('headerLength', plyHeader.headerLength.toString(10));
  }
  return metadataMap;
}
