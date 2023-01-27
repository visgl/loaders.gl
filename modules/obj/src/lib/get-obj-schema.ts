import {Schema, SchemaMetadata, Field, getArrowType} from '@loaders.gl/schema';

export function getOBJSchema(attributes, metadata: Record<string, unknown> = {}): Schema {
  const stringMetadata: SchemaMetadata = {};
  for (const key in metadata) {
    if (key !== 'value') {
      stringMetadata[key] = JSON.stringify(metadata[key]);
    }
  }

  const fields: Field[] = [];
  for (const attributeName in attributes) {
    const attribute = attributes[attributeName];
    const field = getArrowFieldFromAttribute(attributeName, attribute);
    fields.push(field);
  }

  return {fields, metadata: stringMetadata};
}

function getArrowFieldFromAttribute(name: string, attribute): Field {
  const metadata: Record<string, string> = {};
  for (const key in attribute) {
    if (key !== 'value') {
      metadata[key] = JSON.stringify(attribute[key]);
    }
  }

  const type = getArrowType(attribute.value);
  const isSingleValue = !('size' in attribute) || attribute.size === 1;
  return isSingleValue
    ? {name, type, nullable: false, metadata}
    : {
      name, 
      type: {type: 'fixed-size-list', listSize: attribute.size, children: [{name: 'values', type}]},
      nullable: false, 
      metadata
    };
}
