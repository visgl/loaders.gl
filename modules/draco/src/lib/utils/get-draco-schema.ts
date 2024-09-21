import {deduceMeshField, MeshAttribute, Schema, Field} from '@loaders.gl/schema';
import type {DracoAttribute, DracoLoaderData, DracoMetadataEntry} from '../draco-types';

/** Extract an arrow-like schema from a Draco mesh */
export function getDracoSchema(
  attributes: {[attributeName: string]: MeshAttribute},
  loaderData: DracoLoaderData,
  indices?: MeshAttribute
): Schema {
  const metadata = makeMetadata(loaderData.metadata);
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
  return {fields, metadata};
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

function makeMetadata(metadata: {[key: string]: DracoMetadataEntry}): Record<string, string> {
  Object.entries(metadata);
  const serializedMetadata: Record<string, string> = {};
  for (const key in metadata) {
    serializedMetadata[`${key}.string`] = JSON.stringify(metadata[key]);
  }
  return serializedMetadata;
}
