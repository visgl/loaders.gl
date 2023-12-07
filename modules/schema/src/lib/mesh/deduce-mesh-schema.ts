// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {MeshAttribute, MeshAttributes} from '../../types/category-mesh';
import {Schema, Field} from '../../types/schema';
import {getDataTypeFromTypedArray} from '../table/simple-table/data-type';

/**
 * Create a schema for mesh attributes data
 * @param attributes
 * @param metadata
 * @returns
 */
export function deduceMeshSchema(
  attributes: MeshAttributes,
  metadata: Record<string, string> = {}
): Schema {
  const fields = deduceMeshFields(attributes);
  return {fields, metadata};
}

/**
 * Create arrow-like schema field for mesh attribute
 * @param attributeName
 * @param attribute
 * @param optionalMetadata
 * @returns
 */
export function deduceMeshField(
  name: string,
  attribute: MeshAttribute,
  optionalMetadata?: Record<string, string>
): Field {
  const type = getDataTypeFromTypedArray(attribute.value);
  const metadata = optionalMetadata ? optionalMetadata : makeMeshAttributeMetadata(attribute);
  return {
    name,
    type: {type: 'fixed-size-list', listSize: attribute.size, children: [{name: 'value', type}]},
    nullable: false,
    metadata
  };
}

/**
 * Create fields array for mesh attributes
 * @param attributes
 * @returns
 */
function deduceMeshFields(attributes: MeshAttributes): Field[] {
  const fields: Field[] = [];
  for (const attributeName in attributes) {
    const attribute: MeshAttribute = attributes[attributeName];
    fields.push(deduceMeshField(attributeName, attribute));
  }
  return fields;
}

/**
 * Make metadata by mesh attribute properties
 * @param attribute
 * @returns
 */
export function makeMeshAttributeMetadata(attribute: MeshAttribute): Record<string, string> {
  const result: Record<string, string> = {};
  if ('byteOffset' in attribute) {
    result.byteOffset = attribute.byteOffset!.toString(10);
  }
  if ('byteStride' in attribute) {
    result.byteStride = attribute.byteStride!.toString(10);
  }
  if ('normalized' in attribute) {
    result.normalized = attribute.normalized!.toString();
  }
  return result;
}
