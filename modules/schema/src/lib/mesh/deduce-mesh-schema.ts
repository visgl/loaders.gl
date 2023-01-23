// loaders.gl, MIT license

import {MeshAttribute, MeshAttributes} from '../../types/category-mesh';
import {Schema, Field} from '../../types/schema';
import {getArrowType} from '../table/utilities/arrow-type-utils';

/**
 * Create a schema for mesh attributes data
 * @param attributes
 * @param metadata
 * @returns
 */
export function deduceMeshSchema(
  attributes: MeshAttributes,
  metadata: Map<string, string> = new Map()
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
  optionalMetadata?: Map<string, string>
): Field {
  const type = getArrowType(attribute.value);
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
export function makeMeshAttributeMetadata(attribute: MeshAttribute): Map<string, string> {
  const result = new Map();
  if ('byteOffset' in attribute) {
    result.set('byteOffset', attribute.byteOffset!.toString(10));
  }
  if ('byteStride' in attribute) {
    result.set('byteStride', attribute.byteStride!.toString(10));
  }
  if ('normalized' in attribute) {
    result.set('normalized', attribute.normalized!.toString());
  }
  return result;
}
