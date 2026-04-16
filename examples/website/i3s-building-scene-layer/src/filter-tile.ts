import {load} from '@loaders.gl/core';
import {I3SAttributeLoader, type AttributeStorageInfo} from '@loaders.gl/i3s';
import type {TypedArray} from '@loaders.gl/schema';
import {Tile3D} from '@loaders.gl/tiles';

type FiltersByAttribute = {
  attributeName: string;
  value: number;
};

type I3STileAttributes = Record<string, string[] | TypedArray | null>;
type NumericAttributeValueMap = Record<number, string | number>;

/**
 * Filters a tile's indices by comparing a numeric feature attribute against a target value.
 */
export async function filterTile(
  tile: Tile3D,
  filtersByAttribute: FiltersByAttribute | null
): Promise<{isFiltered: boolean; id: string}> {
  const result = {isFiltered: false, id: tile.id};

  if (tile.content.userData?.customFilters !== filtersByAttribute) {
    if (tile.content && filtersByAttribute) {
      if (tile.content.userData?.originalIndices === undefined) {
        tile.content.userData = {};
        tile.content.userData.originalIndices = tile.content.indices;
      }
      tile.content.indices = tile.content.userData?.originalIndices;
      tile.content.userData.customFilters = filtersByAttribute;

      const {indices} = await filterTileIndices(
        tile,
        filtersByAttribute,
        (tile.tileset.loadOptions as any).i3s.token
      );
      if (indices && tile.content.userData.customFilters === filtersByAttribute) {
        tile.content.indices = indices;
        result.isFiltered = true;
      }
    } else if (tile.content && tile.content.userData?.originalIndices !== undefined) {
      tile.content.indices = tile.content.userData.originalIndices;
      tile.content.userData.customFilters = null;
      result.isFiltered = true;
    }
  }
  return result;
}

async function filterTileIndices(
  tile: Tile3D,
  filtersByAttribute: FiltersByAttribute,
  token: string
): Promise<{success: boolean; indices?: Uint32Array}> {
  if (!filtersByAttribute.attributeName.length) {
    return {success: false};
  }

  const filterAttributeField = tile.tileset.tileset.fields.find(
    ({name}) => name === filtersByAttribute.attributeName
  );

  if (
    !filterAttributeField ||
    !['esriFieldTypeDouble', 'esriFieldTypeInteger', 'esriFieldTypeSmallInteger'].includes(
      filterAttributeField.type
    )
  ) {
    return {success: false};
  }

  const tileFilterAttributeData = await loadFeatureAttributeData(
    filterAttributeField.name,
    tile.header.attributeUrls,
    tile.tileset.tileset.attributeStorageInfo,
    token
  );
  if (!tileFilterAttributeData) {
    return {success: false};
  }

  const objectIdField = tile.tileset.tileset.fields.find(({type}) => type === 'esriFieldTypeOID');
  if (!objectIdField) {
    return {success: false};
  }

  const objectIdAttributeData = await loadFeatureAttributeData(
    objectIdField.name,
    tile.header.attributeUrls,
    tile.tileset.tileset.attributeStorageInfo,
    token
  );
  if (!objectIdAttributeData) {
    return {success: false};
  }

  const attributeValuesMap: NumericAttributeValueMap = {};
  const objectIds = objectIdAttributeData[objectIdField.name];
  const attributeValues = tileFilterAttributeData[filterAttributeField.name];
  if (!objectIds || !attributeValues) {
    return {success: false};
  }

  objectIds.forEach((element, index) => {
    if (typeof element === 'number') {
      attributeValuesMap[element] = attributeValues[index] as string | number;
    }
  });

  if (!tile.content.indices) {
    const triangles: number[] = [];
    for (let index = 0; index < tile.content.featureIds.length; index += 3) {
      if (attributeValuesMap[tile.content.featureIds[index]] === filtersByAttribute.value) {
        triangles.push(index);
      }
    }

    const indices = new Uint32Array(3 * triangles.length);

    triangles.forEach((vertex, index) => {
      indices[index * 3] = vertex;
      indices[index * 3 + 1] = vertex + 1;
      indices[index * 3 + 2] = vertex + 2;
    });
    return {success: true, indices};
  }

  const triangles: number[] = [];
  for (let index = 0; index < tile.content.indices.length; index += 3) {
    if (
      attributeValuesMap[tile.content.featureIds[tile.content.indices[index]]] ===
      filtersByAttribute.value
    ) {
      triangles.push(index);
    }
  }

  const indices = new Uint32Array(3 * triangles.length);

  triangles.forEach((vertex, index) => {
    indices[index * 3] = tile.content.indices[vertex];
    indices[index * 3 + 1] = tile.content.indices[vertex + 1];
    indices[index * 3 + 2] = tile.content.indices[vertex + 2];
  });
  return {success: true, indices};
}

async function loadFeatureAttributeData(
  attributeName: string,
  attributeUrls: string[],
  attributesStorageInfo: AttributeStorageInfo[],
  token?: string
): Promise<I3STileAttributes | null> {
  const attributeIndex = attributesStorageInfo.findIndex(({name}) => attributeName === name);
  if (attributeIndex === -1) {
    return null;
  }
  const objectIdAttributeUrl = getUrlWithToken(attributeUrls[attributeIndex], token);
  const attributeType = getAttributeValueType(attributesStorageInfo[attributeIndex]);
  const objectIdAttributeData = await load(objectIdAttributeUrl, I3SAttributeLoader, {
    attributeName,
    attributeType
  });

  return objectIdAttributeData;
}

function getUrlWithToken(url: string, token: string | null = null): string {
  return token ? `${url}?token=${token}` : url;
}

function getAttributeValueType(attribute: AttributeStorageInfo): string {
  if (Object.prototype.hasOwnProperty.call(attribute, 'objectIds')) {
    return 'Oid32';
  }
  if (Object.prototype.hasOwnProperty.call(attribute, 'attributeValues')) {
    return attribute.attributeValues?.valueType || '';
  }
  return '';
}
