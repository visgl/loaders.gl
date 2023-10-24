// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import type {Schema, SchemaMetadata, Field, MeshAttribute} from '@loaders.gl/schema';
import {getDataTypeFromArray} from '@loaders.gl/schema';

/** Get Mesh Schema */
export function getOBJSchema(
  attributes: Record<string, MeshAttribute>,
  metadata: Record<string, unknown> = {}
): Schema {
  const stringMetadata: SchemaMetadata = {};
  for (const key in metadata) {
    if (key !== 'value') {
      stringMetadata[key] = JSON.stringify(metadata[key]);
    }
  }

  const fields: Field[] = [];
  for (const attributeName in attributes) {
    const attribute = attributes[attributeName];
    const field = getFieldFromAttribute(attributeName, attribute);
    fields.push(field);
  }

  return {fields, metadata: stringMetadata};
}

/** Get a Field describing the column from an OBJ attribute */
function getFieldFromAttribute(name: string, attribute: MeshAttribute): Field {
  const metadata: Record<string, string> = {};
  for (const key in attribute) {
    if (key !== 'value') {
      metadata[key] = JSON.stringify(attribute[key]);
    }
  }

  let {type} = getDataTypeFromArray(attribute.value);
  const isSingleValue = attribute.size === 1 || attribute.size === undefined;
  if (!isSingleValue) {
    type = {type: 'fixed-size-list', listSize: attribute.size, children: [{name: 'values', type}]};
  }
  return {name, type, nullable: false, metadata};
}
