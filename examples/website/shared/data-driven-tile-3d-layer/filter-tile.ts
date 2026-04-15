import {load} from '@loaders.gl/core';
import type {AttributeStorageInfo} from '@loaders.gl/i3s';
import {I3SAttributeLoader} from '@loaders.gl/i3s';
import type {TypedArray} from '@loaders.gl/schema';
import type {Tile3D} from '@loaders.gl/tiles';
import type {FiltersByAttribute, TileUpdateResult} from './types';

type I3STileAttributes = Record<string, string[] | TypedArray | null>;

/**
 * Filters an I3S tile mesh by attribute value.
 */
export async function filterTile(
  tile: Tile3D,
  filtersByAttribute: FiltersByAttribute | null
): Promise<TileUpdateResult> {
  const result: TileUpdateResult = {isUpdated: false, id: tile.id};

  if (tile.content.userData?.customFilters === filtersByAttribute) {
    return result;
  }

  if (tile.content && filtersByAttribute) {
    if (tile.content.userData?.originalIndices === undefined) {
      tile.content.userData = {};
      tile.content.userData.originalIndices = tile.content.indices;
    }

    tile.content.indices = tile.content.userData.originalIndices;
    tile.content.userData.customFilters = filtersByAttribute;

    const filteredIndices = await filterTileIndices(
      tile,
      filtersByAttribute,
      (tile.tileset.loadOptions as any)?.i3s?.token
    );

    if (filteredIndices && tile.content.userData.customFilters === filtersByAttribute) {
      tile.content.indices = filteredIndices;
      result.isUpdated = true;
    }

    return result;
  }

  if (tile.content && tile.content.userData?.originalIndices !== undefined) {
    tile.content.indices = tile.content.userData.originalIndices;
    tile.content.userData.customFilters = null;
    result.isUpdated = true;
  }

  return result;
}

/**
 * Computes filtered indices for a tile by attribute value.
 */
async function filterTileIndices(
  tile: Tile3D,
  filtersByAttribute: FiltersByAttribute,
  token?: string
): Promise<Uint32Array | undefined> {
  if (!filtersByAttribute.attributeName.length) {
    return undefined;
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
    return undefined;
  }

  const tileFilterAttributeData = await loadFeatureAttributeData(
    filterAttributeField.name,
    tile.header.attributeUrls,
    tile.tileset.tileset.attributeStorageInfo,
    token
  );
  if (!tileFilterAttributeData) {
    return undefined;
  }

  const objectIdField = tile.tileset.tileset.fields.find(({type}) => type === 'esriFieldTypeOID');
  if (!objectIdField) {
    return undefined;
  }

  const objectIdAttributeData = await loadFeatureAttributeData(
    objectIdField.name,
    tile.header.attributeUrls,
    tile.tileset.tileset.attributeStorageInfo,
    token
  );
  if (!objectIdAttributeData) {
    return undefined;
  }

  const objectIdValues = objectIdAttributeData[objectIdField.name];
  const filterValues = tileFilterAttributeData[filterAttributeField.name];
  if (!objectIdValues || !filterValues) {
    return undefined;
  }

  const attributeValuesMap: Record<string, string | number | null | undefined> = {};
  objectIdValues.forEach((element, index) => {
    attributeValuesMap[String(element)] = filterValues[index] as string | number | null | undefined;
  });

  if (!tile.content.indices) {
    const triangles: number[] = [];
    for (let index = 0; index < tile.content.featureIds.length; index += 3) {
      if (attributeValuesMap[String(tile.content.featureIds[index])] === filtersByAttribute.value) {
        triangles.push(index);
      }
    }

    const indices = new Uint32Array(3 * triangles.length);
    triangles.forEach((vertexIndex, triangleIndex) => {
      indices[triangleIndex * 3] = vertexIndex;
      indices[triangleIndex * 3 + 1] = vertexIndex + 1;
      indices[triangleIndex * 3 + 2] = vertexIndex + 2;
    });
    return indices;
  }

  const triangles: number[] = [];
  for (let index = 0; index < tile.content.indices.length; index += 3) {
    if (
      attributeValuesMap[String(tile.content.featureIds[tile.content.indices[index]])] ===
      filtersByAttribute.value
    ) {
      triangles.push(index);
    }
  }

  const indices = new Uint32Array(3 * triangles.length);
  triangles.forEach((vertexIndex, triangleIndex) => {
    indices[triangleIndex * 3] = tile.content.indices[vertexIndex];
    indices[triangleIndex * 3 + 1] = tile.content.indices[vertexIndex + 1];
    indices[triangleIndex * 3 + 2] = tile.content.indices[vertexIndex + 2];
  });
  return indices;
}

/**
 * Loads feature attribute data for a tile.
 */
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

  const attributeUrl = getUrlWithToken(attributeUrls[attributeIndex], token);
  const attributeType = getAttributeValueType(attributesStorageInfo[attributeIndex]);

  return await load(attributeUrl, I3SAttributeLoader, {
    attributeName,
    attributeType
  });
}

/**
 * Adds an ArcGIS token to an attribute URL when present.
 */
function getUrlWithToken(url: string, token: string | null = null): string {
  return token ? `${url}?token=${token}` : url;
}

/**
 * Resolves the value type for an I3S attribute storage entry.
 */
function getAttributeValueType(attribute: AttributeStorageInfo): string {
  if (Object.prototype.hasOwnProperty.call(attribute, 'objectIds')) {
    return 'Oid32';
  }
  if (Object.prototype.hasOwnProperty.call(attribute, 'attributeValues')) {
    return attribute.attributeValues?.valueType || '';
  }
  return '';
}
