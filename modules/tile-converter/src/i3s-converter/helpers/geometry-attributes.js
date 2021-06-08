import {concatenateTypedArrays} from '@loaders.gl/loader-utils';

const VALUES_PER_VERTEX = 3;
const POSITIONS_AND_NORMALS_PER_TRIANGLE = 9;

/**
 * Generate geometry attributes with faceRange and featureCount
 * @param {Object} attributes
 * @returns {Object} Object with featureCount, reordered attributes and changed faceRange.
 */
export function generateAttributes(attributes) {
  const {positions, normals, texCoords, colors, featureIndices, triangleCount} = attributes;

  if (!featureIndices.length) {
    return {
      faceRange: new Uint32Array([0, triangleCount - 1]),
      featureIds: [0],
      featureCount: 1,
      positions,
      normals,
      texCoords,
      colors
    };
  }

  const {faceRange, featureCount, featureIds} = calculateFaceRangesAndFeaturesCount(featureIndices);
  const attributeObjects = makeAttributeObjects({faceRange, featureIds, ...attributes});
  const unifiedAttributeObjectsByFeatureIds = unifyObjectsByFeatureId(attributeObjects);
  const groupedAttributes = groupAttributesAndRangesByFeatureId(
    unifiedAttributeObjectsByFeatureIds
  );
  return {featureCount, ...groupedAttributes};
}

/**
 * Calculates face Ranges and feature count based on featureIndices.
 * @param {Object} featureIndices
 * @returns {Object} Object with featureCount, reordered attributes and changed faceRange.
 */
function calculateFaceRangesAndFeaturesCount(featureIndices) {
  let rangeIndex = 1;
  let featureIndex = 1;
  let currentFeatureId = featureIndices[0];
  const faceRangeList = [];
  const featureIds = [];
  const uniqueFeatureIds = [currentFeatureId];

  faceRangeList[0] = 0;
  featureIds[0] = currentFeatureId;

  for (let index = 1; index < featureIndices.length; index++) {
    if (currentFeatureId !== featureIndices[index]) {
      faceRangeList[rangeIndex] = index / VALUES_PER_VERTEX - 1;
      faceRangeList[rangeIndex + 1] = index / VALUES_PER_VERTEX;
      featureIds[featureIndex] = featureIndices[index];

      if (!uniqueFeatureIds.includes(featureIndices[index])) {
        uniqueFeatureIds.push(featureIndices[index]);
      }

      rangeIndex += 2;
      featureIndex += 1;
    }
    currentFeatureId = featureIndices[index];
  }

  faceRangeList[rangeIndex] = featureIndices.length / VALUES_PER_VERTEX - 1;

  const faceRange = new Uint32Array(faceRangeList);
  const featureCount = uniqueFeatureIds.length;

  return {faceRange, featureCount, featureIds};
}

/**
 * Generate list of attribute object grouped by feature ids.
 * @param {Object} attributes
 * @returns {Array} sorted list of attribute objects.
 */
function makeAttributeObjects(attributes) {
  const {featureIds, positions, normals, colors, texCoords, faceRange} = attributes;
  const groupedData = [];

  let positionsList = new Float32Array(positions);
  let normalsList = new Float32Array(normals);
  let colorsList = new Uint8Array(colors);
  let texCoordsList = new Float32Array(texCoords);

  let faceRangeIndex = 0;

  for (let index = 0; index < featureIds.length; index++) {
    const startIndex = faceRange[index + faceRangeIndex];
    const endIndex = faceRange[index + faceRangeIndex + 1];

    const positionsCount = getSliceAttributeCount('positions', startIndex, endIndex);
    const normalsCount = getSliceAttributeCount('normals', startIndex, endIndex);
    const colorsCount = getSliceAttributeCount('colors', startIndex, endIndex);
    const texCoordsCount = getSliceAttributeCount('texCoords', startIndex, endIndex);

    groupedData.push({
      featureId: featureIds[index],
      positions: positionsList.slice(0, positionsCount),
      normals: normalsList.slice(0, normalsCount),
      colors: colorsList.slice(0, colorsCount),
      texCoords: texCoordsList.slice(0, texCoordsCount)
    });

    positionsList = positionsList.slice(positionsCount);
    normalsList = normalsList.slice(normalsCount);
    colorsList = colorsList.slice(colorsCount);
    texCoordsList = texCoordsList.slice(texCoordsCount);

    faceRangeIndex += 1;
  }

  return groupedData.sort((first, second) => first.featureId - second.featureId);
}

/**
 * Generate sliced count for generating attribute objects depends on attribute name and range.
 * @param {String} attributeName
 * @param {Number} startIndex
 * @param {Number} endIndex
 * @returns {Number} - sliced count
 */
function getSliceAttributeCount(attributeName, startIndex, endIndex) {
  const colorsPerVertex = 4;
  const texCoordsPerVertex = 2;

  const trianglesCount = endIndex - startIndex + 1;
  const vertexCount = trianglesCount * 3;

  switch (attributeName) {
    case 'positions':
    case 'normals':
      return trianglesCount * POSITIONS_AND_NORMALS_PER_TRIANGLE;
    case 'colors':
      return vertexCount * colorsPerVertex;
    case 'texCoords':
      return vertexCount * texCoordsPerVertex;
    default:
      return 0;
  }
}

/**
 * Generates unique object list depends on feature ids and concantenate their attributes.
 * @param {Array} sortedData
 * @returns {Array} - unique list of objects
 */
function unifyObjectsByFeatureId(sortedData) {
  const uniqueObjects = [];

  for (let index = 0; index < sortedData.length; index++) {
    const currentObject = sortedData[index];
    const existedObject = uniqueObjects.find((obj) => obj.featureId === currentObject.featureId);

    if (existedObject) {
      existedObject.positions = concatenateTypedArrays(
        existedObject.positions,
        currentObject.positions
      );
      existedObject.normals = concatenateTypedArrays(existedObject.normals, currentObject.normals);
      existedObject.colors = concatenateTypedArrays(existedObject.colors, currentObject.colors);
      existedObject.texCoords = concatenateTypedArrays(
        existedObject.texCoords,
        currentObject.texCoords
      );
    } else {
      uniqueObjects.push(currentObject);
    }
  }

  return uniqueObjects;
}

/**
 * Generates attribute objects with new faceRange and reordered attributes.
 * @param {Array} unifiedObjects
 * @returns {Object} - ugenerated attributes with new faceRange.
 */
function groupAttributesAndRangesByFeatureId(unifiedObjects) {
  const firstAttributeObject = unifiedObjects[0];
  const featureIds = [firstAttributeObject.featureId];

  let positions = new Float32Array(firstAttributeObject.positions);
  let normals = new Float32Array(firstAttributeObject.normals);
  let colors = new Uint8Array(firstAttributeObject.colors);
  let texCoords = new Float32Array(firstAttributeObject.texCoords);
  const range = [0];

  let objIndex = 0;
  let sum = 0;

  for (let index = 1; index < unifiedObjects.length; index++) {
    const currentAttributesObject = unifiedObjects[index];
    featureIds.push(currentAttributesObject.featureId);

    positions = concatenateTypedArrays(positions, currentAttributesObject.positions);
    normals = concatenateTypedArrays(normals, currentAttributesObject.normals);
    colors = concatenateTypedArrays(colors, currentAttributesObject.colors);
    texCoords = concatenateTypedArrays(texCoords, currentAttributesObject.texCoords);

    const groupedObject = unifiedObjects[objIndex];
    range.push(groupedObject.positions.length / POSITIONS_AND_NORMALS_PER_TRIANGLE - 1 + sum);
    range.push(groupedObject.positions.length / POSITIONS_AND_NORMALS_PER_TRIANGLE + sum);

    sum += groupedObject.positions.length / POSITIONS_AND_NORMALS_PER_TRIANGLE;
    objIndex += 1;
  }

  range.push(positions.length / POSITIONS_AND_NORMALS_PER_TRIANGLE - 1);

  const faceRange = new Uint32Array(range);
  return {faceRange, featureIds, positions, normals, colors, texCoords};
}
