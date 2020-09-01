import {Schema, Field, Float32, Float64, Uint8, FixedSizeList} from '@loaders.gl/tables';

export function makeSchemaFromAttributes(attributes, metadata = {}) {
  let metadataMap = null;
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

// TODO - there is probably already a util like this
function getArrowTypeFromTypedArray(array) {
  switch (array.constructor) {
    case Float32Array:
      return new Float32();
    case Float64Array:
      return new Float64();
    case Uint8Array:
      return new Uint8();
    // TODO - add more types
    default:
      throw new Error('array type not supported');
  }
}
