import {Vector3} from 'math.gl';

/**
 * Generates data for display normals by Line layer.
 * @param {object} tile
 * @returns {object} - returs object with typed normals and positions array and length
 */
export function generateBinaryNormalsDebugData(tile) {
  if (
    !tile.content ||
    !tile.content.attributes ||
    !tile.content.attributes.normals ||
    !tile.content.attributes.positions
  ) {
    return {};
  }

  const normals = tile.content.attributes.normals.value;
  const positions = tile.content.attributes.positions.value;
  const modelMatrix = tile.content.modelMatrix;
  const cartographicOrigin = tile.content.cartographicOrigin;

  return {src: {normals, positions}, length: positions.length, modelMatrix, cartographicOrigin};
}

/**
 * @param {number} index
 * @param {object} data
 * @param {number} normalsGap - allows to show every x normal per tile normals to avoid mess on the screen
 * @returns {array} - source position in cartographic coordinates
 */
export function getNormalSourcePosition(index, data, normalsGap) {
  let sourcePosition = {};

  if (index % normalsGap === 0 || normalsGap === 0) {
    const positions = data.src.positions;
    const position = new Vector3([
      positions[index * 3],
      positions[index * 3 + 1],
      positions[index * 3 + 2]
    ]);
    sourcePosition = position;
  }

  return sourcePosition;
}

/**
 *
 * @param {number} index
 * @param {object} data
 * @param {number} normalsGap - allows to show every x normal per tile normals to avoid mess on the screen
 * @param {number} normalsLength - allows change visible normals length
 * @returns {array} - target position in cartographic coordinates
 */
export function getNormalTargetPosition(index, data, normalsGap, normalsLength) {
  let targetPosition = {};

  if (index % normalsGap === 0 || normalsGap === 0) {
    const positions = data.src.positions;
    const normals = data.src.normals;

    const position = new Vector3([
      positions[index * 3],
      positions[index * 3 + 1],
      positions[index * 3 + 2]
    ]);
    const normal = new Vector3([
      normals[index * 3],
      normals[index * 3 + 1],
      normals[index * 3 + 2]
    ]).multiplyByScalar(normalsLength);
    targetPosition = position.add(normal);
  }

  return targetPosition;
}
