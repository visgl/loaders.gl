import {Schema, Field, FixedSizeList, getArrowTypeFromTypedArray} from '@loaders.gl/schema';

import {MeshAttribute, DracoAttribute, DracoLoaderData, DracoMetadataEntry} from '../../types';

export function makeSchemaFromAttributes(
  attributes: {[attributeName: string]: MeshAttribute},
  loaderData: DracoLoaderData,
  indices?: MeshAttribute
): Schema {
  const metadataMap = makeMetadata(loaderData.metadata);
  const fields: Field[] = [];
  const namedLoaderDataAttributes = transformAttributesLoaderData(loaderData.attributes);
  for (const attributeName in attributes) {
    const attribute = attributes[attributeName];
    const field = getArrowFieldFromAttribute(
      attributeName,
      attribute,
      namedLoaderDataAttributes[attributeName]
    );
    fields.push(field);
  }
  if (indices) {
    const indicesField = getArrowFieldFromAttribute('indices', indices);
    fields.push(indicesField);
  }
  return new Schema(fields, metadataMap);
}

function transformAttributesLoaderData(loaderData: {[key: number]: DracoAttribute}): {
  [attributeName: string]: DracoAttribute;
} {
  const result: {[attributeName: string]: DracoAttribute} = {};
  for (const key in loaderData) {
    const dracoAttribute = loaderData[key];
    result[dracoAttribute.name || 'undefined'] = dracoAttribute;
  }
  return result;
}

function getArrowFieldFromAttribute(
  attributeName: string,
  attribute: MeshAttribute,
  loaderData?: DracoAttribute
): Field {
  const metadataMap = loaderData ? makeMetadata(loaderData.metadata) : undefined;
  const type = getArrowTypeFromTypedArray(attribute.value);
  return new Field(
    attributeName,
    new FixedSizeList(attribute.size, new Field('value', type)),
    false,
    metadataMap
  );
}

function makeMetadata(metadata: {[key: string]: DracoMetadataEntry}): Map<string, string> {
  const metadataMap = new Map();
  for (const key in metadata) {
    metadataMap.set(`${key}.string`, JSON.stringify(metadata[key]));
  }

  return metadataMap;
}
