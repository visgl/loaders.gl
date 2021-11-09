import {MeshAttribute, MeshAttributes} from './mesh-types';
import {Schema, Field, FixedSizeList} from '../../lib/schema/schema';
import {getArrowTypeFromTypedArray} from '../../lib/arrow/arrow-like-type-utils';

/**
 * Create a schema for mesh attributes data
 * @param attributes
 * @param metadata
 * @returns
 */
export function deduceMeshSchema(
  attributes: MeshAttributes,
  metadata?: Map<string, string>
): Schema {
  const fields = deduceMeshFields(attributes);
  return new Schema(fields, metadata);
}

/**
 * Create arrow-like schema field for mesh attribute
 * @param attributeName
 * @param attribute
 * @param optionalMetadata
 * @returns
 */
export function deduceMeshField(
  attributeName: string,
  attribute: MeshAttribute,
  optionalMetadata?: Map<string, string>
): Field {
  const type = getArrowTypeFromTypedArray(attribute.value);
  const metadata = optionalMetadata ? optionalMetadata : makeMeshAttributeMetadata(attribute);
  const field = new Field(
    attributeName,
    new FixedSizeList(attribute.size, new Field('value', type)),
    false,
    metadata
  );
  return field;
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
