import type {
  GeometryAttributes,
  ConvertedAttributes,
  GroupedByFeatureIdAttributes,
  GroupedAttributes
} from '../types';
import {concatenateTypedArrays} from '@loaders.gl/loader-utils';

const VALUES_PER_VERTEX = 3;
const POSITIONS_AND_NORMALS_PER_TRIANGLE = 9;

/**
 * Generate geometry attributes with faceRange and featureCount
 * @param attributes
 * @returns attirbutes with featureCount, featureIds and changed faceRange.
 */
export function generateAttributes(attributes: ConvertedAttributes): GeometryAttributes {
  const {positions, normals, texCoords, colors, uvRegions, featureIndices} = attributes;
  const triangleCount = positions.length / POSITIONS_AND_NORMALS_PER_TRIANGLE;

  if (!featureIndices.length) {
    return {
      faceRange: new Uint32Array([0, triangleCount - 1]),
      featureIds: [0],
      featureCount: 1,
      positions,
      normals,
      texCoords,
      colors,
      uvRegions
    };
  }

  const data = calculateFaceRangesAndFeaturesCount(featureIndices);
  const attributeObjects = makeAttributeObjects({...data, ...attributes});
  const unifiedAttributeObjectsByFeatureIds = unifyObjectsByFeatureId(attributeObjects);
  const groupedAttributes = groupAttributesAndRangesByFeatureId(
    unifiedAttributeObjectsByFeatureIds,
    data.featureCount
  );
  return groupedAttributes;
}

/**
 * Calculates face Ranges and feature count based on featureIndices.
 * @param featureIndices
 * @returns Object with featureCount, reordered attributes and changed faceRange.
 */
function calculateFaceRangesAndFeaturesCount(featureIndices: number[]): {
  faceRange: Uint32Array;
  featureCount: number;
  featureIds: number[];
} {
  let rangeIndex = 1;
  let featureIndex = 1;
  let currentFeatureId = getFrequentValue(featureIndices.slice(0, VALUES_PER_VERTEX));
  const faceRangeList: any[] = [];
  const featureIds: any[] = [];
  const uniqueFeatureIds = [currentFeatureId];

  faceRangeList[0] = 0;
  featureIds[0] = currentFeatureId;

  for (let index = VALUES_PER_VERTEX; index < featureIndices.length; index += VALUES_PER_VERTEX) {
    const newFeatureId = getFrequentValue(featureIndices.slice(index, index + VALUES_PER_VERTEX));
    if (currentFeatureId !== newFeatureId) {
      faceRangeList[rangeIndex] = index / VALUES_PER_VERTEX - 1;
      faceRangeList[rangeIndex + 1] = index / VALUES_PER_VERTEX;
      featureIds[featureIndex] = newFeatureId;

      if (!uniqueFeatureIds.includes(newFeatureId)) {
        uniqueFeatureIds.push(newFeatureId);
      }

      rangeIndex += 2;
      featureIndex += 1;
    }
    currentFeatureId = newFeatureId;
  }

  faceRangeList[rangeIndex] = featureIndices.length / VALUES_PER_VERTEX - 1;

  const faceRange = new Uint32Array(faceRangeList);
  const featureCount = uniqueFeatureIds.length;

  return {faceRange, featureCount, featureIds};
}

/**
 * Find most frequent value to avoid situation where one vertex can be part of multiple features (objects).
 * @param values
 */
function getFrequentValue(values: number[]): number {
  const map: {[key: number]: number} = {};

  let mostFrequentValue = values[0];
  let maxCount = 1;

  for (const value of values) {
    // Save item and it's frequency count to the map.
    map[value] = (map[value] || 0) + 1;
    // Find max count of frequency.
    maxCount = maxCount > map[value] ? maxCount : map[value];
    // Find the most frequent value.
    mostFrequentValue = maxCount > map[value] ? mostFrequentValue : value;
  }

  return mostFrequentValue;
}

/**
 * Generate list of attribute object grouped by feature ids.
 * @param  attributes
 * @returns sorted list of attribute objects.
 */
function makeAttributeObjects(attributes: GeometryAttributes): GroupedByFeatureIdAttributes[] {
  const {
    featureIds,
    positions,
    normals,
    colors,
    uvRegions,
    texCoords,
    faceRange = new Uint32Array(0)
  } = attributes;
  const groupedData: GroupedByFeatureIdAttributes[] = [];

  let positionsList = new Float32Array(positions);
  let normalsList = new Float32Array(normals);
  let colorsList = new Uint8Array(colors);
  let texCoordsList = new Float32Array(texCoords);
  let uvRegionsList = new Uint16Array(uvRegions);
  let positionsOffset = 0;
  let normalsOffset = 0;
  let colorsOffset = 0;
  let uvRegionsOffset = 0;
  let texCoordsOffset = 0;

  for (let index = 0; index < featureIds.length; index++) {
    const startIndex = faceRange[index * 2];
    const endIndex = faceRange[index * 2 + 1];

    const positionsCount = getSliceAttributeCount('positions', startIndex, endIndex);
    const normalsCount = getSliceAttributeCount('normals', startIndex, endIndex);
    const colorsCount = getSliceAttributeCount('colors', startIndex, endIndex);
    const uvRegionsCount = getSliceAttributeCount('uvRegions', startIndex, endIndex);
    const texCoordsCount = getSliceAttributeCount('texCoords', startIndex, endIndex);

    groupedData.push({
      featureId: featureIds[index],
      positions: positionsList.subarray(positionsOffset, positionsOffset + positionsCount),
      normals: normalsList.subarray(normalsOffset, normalsOffset + normalsCount),
      colors: colorsList.subarray(colorsOffset, colorsOffset + colorsCount),
      uvRegions: uvRegionsList.subarray(uvRegionsOffset, uvRegionsOffset + uvRegionsCount),
      texCoords: texCoordsList.subarray(texCoordsOffset, texCoordsOffset + texCoordsCount)
    });

    positionsOffset += positionsCount;
    normalsOffset += normalsCount;
    colorsOffset += colorsCount;
    uvRegionsOffset += uvRegionsCount;
    texCoordsOffset += texCoordsCount;
  }

  return groupedData;
}

/**
 * Generate sliced count for generating attribute objects depends on attribute name and range.
 * @param attributeName
 * @param startIndex
 * @param endIndex
 * @returns sliced count
 */
function getSliceAttributeCount(
  attributeName: string,
  startIndex: number,
  endIndex: number
): number {
  const itemsPerVertex4 = 4;
  const texCoordsPerVertex = 2;

  const trianglesCount = endIndex - startIndex + 1;
  const vertexCount = trianglesCount * 3;

  switch (attributeName) {
    case 'positions':
    case 'normals':
      return trianglesCount * POSITIONS_AND_NORMALS_PER_TRIANGLE;
    case 'colors':
    case 'uvRegions':
      return vertexCount * itemsPerVertex4;
    case 'texCoords':
      return vertexCount * texCoordsPerVertex;
    default:
      return 0;
  }
}

/**
 * Generates unique object list depends on feature ids and concantenate their attributes.
 * @param sortedData
 * @returns unique list of objects
 */
function unifyObjectsByFeatureId(
  sortedData: GroupedByFeatureIdAttributes[]
): GroupedByFeatureIdAttributes[] {
  const groupedMetadata: {
    featureId: number;
    length: number;
    attributes: GroupedByFeatureIdAttributes[];
  }[] = [];
  for (const data of sortedData) {
    const existingObject = groupedMetadata.find((obj) => obj.featureId === data.featureId);
    if (existingObject) {
      existingObject.length += data.positions.length / 3;
      existingObject.attributes.push(data);
    } else {
      groupedMetadata.push({
        featureId: data.featureId,
        length: data.positions.length / 3,
        attributes: [data]
      });
    }
  }

  const uniqueObjects: GroupedByFeatureIdAttributes[] = [];
  for (const metatada of groupedMetadata) {
    const attributes = concatenateAttributes(metatada.attributes);

    uniqueObjects.push({
      featureId: metatada.featureId,
      ...attributes
    });
  }

  return uniqueObjects;
}

/**
 * Generates attribute objects with new faceRange and reordered attributes.
 * @param unifiedObjects
 * @returns generated attributes with new faceRange.
 */
function groupAttributesAndRangesByFeatureId(
  unifiedObjects: GroupedByFeatureIdAttributes[],
  featureCount: number
): GeometryAttributes {
  const firstAttributeObject = unifiedObjects[0];
  const featureIds = [firstAttributeObject.featureId || 0];
  const range = [0];

  let objIndex = 0;
  let sum = 0;

  for (let index = 1; index < unifiedObjects.length; index++) {
    const currentAttributesObject = unifiedObjects[index];
    featureIds.push(currentAttributesObject.featureId || 0);

    const groupedObject = unifiedObjects[objIndex];
    range.push(groupedObject.positions.length / POSITIONS_AND_NORMALS_PER_TRIANGLE - 1 + sum);
    range.push(groupedObject.positions.length / POSITIONS_AND_NORMALS_PER_TRIANGLE + sum);

    sum += groupedObject.positions.length / POSITIONS_AND_NORMALS_PER_TRIANGLE;
    objIndex += 1;
  }

  const attributes = concatenateAttributes(unifiedObjects);

  range.push(attributes.positions.length / POSITIONS_AND_NORMALS_PER_TRIANGLE - 1);

  const faceRange = new Uint32Array(range);
  return {faceRange, featureIds, featureCount, ...attributes};
}

/**
 * Concatenate attributes typed arrays
 * @param attributes - grouped by featureId typed arrays
 * @returns - concatenated typed array list
 */
function concatenateAttributes(attributes: GroupedByFeatureIdAttributes[]): GroupedAttributes {
  const positionGroups = attributes.map(({positions}) => positions);
  const positions =
    positionGroups.length > 1 ? concatenateTypedArrays(...positionGroups) : positionGroups[0];

  const normalGroups = attributes.map(({normals}) => normals);
  const normals =
    normalGroups.length > 1 ? concatenateTypedArrays(...normalGroups) : normalGroups[0];

  const colorGroups = attributes.map(({colors}) => colors);
  const colors = colorGroups.length > 1 ? concatenateTypedArrays(...colorGroups) : colorGroups[0];

  const texCoordGroups = attributes.map(({texCoords}) => texCoords);
  const texCoords =
    texCoordGroups.length > 1 ? concatenateTypedArrays(...texCoordGroups) : texCoordGroups[0];

  const uvRegionGroups = attributes.map(({uvRegions}) => uvRegions);
  const uvRegions =
    uvRegionGroups.length > 1 ? concatenateTypedArrays(...uvRegionGroups) : uvRegionGroups[0];
  return {
    positions,
    normals,
    colors,
    texCoords,
    uvRegions
  };
}
