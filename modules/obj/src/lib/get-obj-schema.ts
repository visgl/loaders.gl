import {Schema, Field, getArrowType} from '@loaders.gl/schema';

export function getOBJSchema(attributes, metadata = {}): Schema {
  let metadataMap;
  for (const key in metadata) {
    metadataMap = metadataMap || new Map();
    if (key !== 'value') {
      metadataMap.set(key, JSON.stringify(metadata[key]));
    }
  }

  const fields: Field[] = [];
  for (const attributeName in attributes) {
    const attribute = attributes[attributeName];
    const field = getArrowFieldFromAttribute(attributeName, attribute);
    fields.push(field);
  }
  return {fields, metadata: metadataMap};
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
