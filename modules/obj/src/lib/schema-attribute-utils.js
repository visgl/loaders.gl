import {Schema, Field, FixedSizeList, getArrowTypeFromTypedArray} from '@loaders.gl/schema';

export function makeSchemaFromAttributes(attributes, metadata = {}) {
  let metadataMap;
  for (const key in metadata) {
    metadataMap = metadataMap || new Map();
    if (key !== 'value') {
      metadataMap.set(key, JSON.stringify(metadata[key]));
    }
  }

  const fields = [];
  for (const attributeName in attributes) {
    const attribute = attributes[attributeName];
    const field = getArrowFieldFromAttribute(attributeName, attribute);
    fields.push(field);
  }
  return new Schema(fields, metadataMap);
}

function getArrowFieldFromAttribute(attributeName, attribute) {
  const metadataMap = new Map();
  for (const key in attribute) {
    if (key !== 'value') {
      metadataMap.set(key, JSON.stringify(attribute[key]));
    }
  }

  const type = getArrowTypeFromTypedArray(attribute.value);
  const isSingleValue = !('size' in attribute) || attribute.size === 1;
  return isSingleValue
    ? new Field(attributeName, type, false, metadataMap)
    : new Field(
        attributeName,
        new FixedSizeList(attribute.size, new Field('value', type)),
        false,
        metadataMap
      );
}
