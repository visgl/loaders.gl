// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Mesh, ColumnarTable, ArrowTable, Schema} from '@loaders.gl/schema';
import {getFixedSizeListSize} from '../arrow-utils/arrow-fixed-size-list-utils';
import {serializeArrowSchema} from '../schema/convert-arrow-schema';
// import {makeMeshAttributeMetadata} from './deduce-mesh-schema';

/**
 * Convert a mesh to a specific shape
 */
export function convertTableToMesh(table: ColumnarTable | ArrowTable): Mesh {
  switch (table.shape) {
    // case 'columnar-table':
    //   return convertColumnarTableToMesh(table);
    case 'arrow-table':
      return convertArrowTableToMesh(table);
    default:
      throw new Error(table.shape);
  }
}

export function convertArrowTableToMesh(table: ArrowTable): Mesh {
  const arrowTable = table.data;

  const schema = serializeArrowSchema(arrowTable.schema);
  const fields = schema.fields;

  const attributes: Mesh['attributes'] = {};
  for (const field of fields) {
    const {name} = field;
    const attributeData = arrowTable.getChild(name)!;
    const size = getFixedSizeListSize(attributeData);
    const typedArray = attributeData?.toArray();
    attributes[name] = {value: typedArray, size};
  }

  fixMetadata(schema);
  const topology = schema.metadata.topology as any;

  return {schema, attributes, topology, mode: 0};
}

function fixMetadata(schema: Schema) {
  schema.metadata ||= {};
  schema.metadata.topology ||= 'point-list';
  schema.metadata.mode ||= '0';
}
