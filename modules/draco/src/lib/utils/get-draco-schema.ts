import {deduceMeshField, MeshAttribute} from '@loaders.gl/schema';
import {Schema, Field} from '@loaders.gl/schema';
import type {DracoAttribute, DracoLoaderData, DracoMetadataEntry} from '../draco-types';

/** Extract an arrow-like schema from a Draco mesh */
export function getDracoSchema(
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
  const field = deduceMeshField(attributeName, attribute, metadataMap);
  return field;
}

function makeMetadata(metadata: {[key: string]: DracoMetadataEntry}): Map<string, string> {
  const metadataMap = new Map();
  for (const key in metadata) {
    metadataMap.set(`${key}.string`, JSON.stringify(metadata[key]));
  }
  return metadataMap;
}
