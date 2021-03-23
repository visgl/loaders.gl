import {
  OrientedBoundingBox,
  BoundingSphere,
  makeOrientedBoundingBoxFromPoints,
  makeBoundingSphereFromPoints
} from '@math.gl/culling';
import {CubeGeometry} from '@luma.gl/engine';
import {BOUNDING_VOLUME_WARNING_TYPE, LOD_WARNING_TYPE, PARENT_LOD_WARNING_TYPE} from './constants';
import {Vector3} from 'math.gl';
import {Ellipsoid} from '@math.gl/geospatial';

const NO_DATA = 'No Data';
const OBB = 'Oriented Bounding Box';
const MBS = 'Minimum Bounding Sphere';

const REFINEMENT_TYPES = {
  1: 'Add',
  2: 'Replace'
};

const FLOAT_VALUES_FIXED_COUNT = 3;

/**
 * Return short tile info
 * @param {object} tileHeader
 * @returns {object} - short tile info for debugging purposes
 */
export function getShortTileDebugInfo(tileHeader) {
  const childrenInfo = getChildrenInfo(tileHeader.header.children);

  return {
    ['Tile Id']: tileHeader.id,
    Type: tileHeader.type || NO_DATA,
    ['Children Count']: childrenInfo.count,
    ['Children Ids']: childrenInfo.ids,
    ['Vertex count']: tileHeader.content.vertexCount || NO_DATA,
    ['Distance to camera']: `${formatFloatNumber(tileHeader._distanceToCamera)} m` || NO_DATA
  };
}

/**
 * Return extended tile info
 * @param {object} tileHeader
 * @returns {object} - extended tile info for debugging purposes
 */
export function getTileDebugInfo(tileHeader) {
  return {
    ...getShortTileDebugInfo(tileHeader),
    ['Refinement Type']: REFINEMENT_TYPES[tileHeader.refine] || NO_DATA,
    ['Has Texture']: Boolean(tileHeader.content.texture),
    ['Has Material']: Boolean(tileHeader.content.material),
    ['Bounding Type']: getBoundingType(tileHeader),
    ['LOD Metric Type']: tileHeader.lodMetricType || NO_DATA,
    ['LOD Metric Value']: formatFloatNumber(tileHeader.lodMetricValue) || NO_DATA,
    ['Screen Space Error']: formatFloatNumber(tileHeader._screenSpaceError) || NO_DATA
  };
}

/**
 * Generates list of tile warnings
 * @param {object} tile
 * @returns {{message: {type: string, title: string}}[]} -List of warnings
 */
export function validateTile(tile) {
  const tileWarnings = [];

  checkBoundingVolumes(tile, tileWarnings);
  checkLOD(tile, tileWarnings);

  return tileWarnings;
}

/**
 * Generates geometry vs texture metrics
 * @param {object} tile
 * @returns {object} - List of warnings
 */
// eslint-disable-next-line max-statements, complexity
export function getGeometryVsTextureMetrics(tile) {
  if (!(tile && tile.content && tile.content.attributes)) {
    return null;
  }
  const attributes = tile.content.attributes;
  const {positions, texCoords} = attributes;
  if (!(positions && texCoords)) {
    return null;
  }

  const textureSize = getTextureSize(tile);
  if (!textureSize) {
    return null;
  }
  const pixelArea = 1 / textureSize;
  let minGeometryArea = Number.MAX_VALUE;
  let minTexCoordArea = Number.MAX_VALUE;
  let geometryNullTriangleCount = 0;
  let texCoordNullTriangleCount = 0;
  let geometrySmallTriangleCount = 0;
  let texCoordSmallTriangleCount = 0;
  const vertexCount = positions.value.length / positions.size;
  for (let i = 0; i < vertexCount; i += 3) {
    const geometryVertices = getTriangleVertices(positions, i);
    const texCoordVertices = getTriangleVertices(texCoords, i);
    const geometryArea = getTriangleArea(geometryVertices);
    const texCoordArea = getTriangleArea(texCoordVertices);

    if (geometryArea === 0) {
      geometryNullTriangleCount++;
    } else {
      minGeometryArea = Math.min(minGeometryArea, geometryArea);
    }
    if (texCoordArea === 0) {
      texCoordNullTriangleCount++;
    } else {
      minTexCoordArea = Math.min(minTexCoordArea, texCoordArea);
    }
    if (geometryArea < 0.001) {
      geometrySmallTriangleCount++;
    }
    if (texCoordArea < pixelArea) {
      texCoordSmallTriangleCount++;
    }
  }
  return {
    triangles: vertexCount / 3,
    geometryNullTriangleCount,
    geometrySmallTriangleCount,
    texCoordNullTriangleCount,
    texCoordSmallTriangleCount,
    minGeometryArea,
    minTexCoordArea,
    pixelArea
  };
}

/**
 * Do float numbers formatting based on fixed value
 * @param {number} tile
 * @returns {number}
 */
function formatFloatNumber(value) {
  if (!value) {
    return null;
  }

  return value.toFixed(FLOAT_VALUES_FIXED_COUNT);
}

/**
 * Defines the Bounding Box type
 * @param {number} tile
 * @returns {string} - defined Bounding box type
 */
function getBoundingType(tile) {
  if (tile.header.obb || tile.boundingVolume instanceof OrientedBoundingBox) {
    return OBB;
  }
  return MBS;
}

/**
 * Get tile's children info (count, ids)
 * @param {array} children
 * @returns {object} - children data
 */
function getChildrenInfo(children) {
  if (!children || !children.length) {
    return {
      count: NO_DATA,
      ids: NO_DATA
    };
  }

  const clildrenIds = [];

  for (const index in children) {
    clildrenIds.push(children[index].id);
  }

  return {
    count: clildrenIds.length,
    ids: clildrenIds.join(', ')
  };
}

/**
 * Do validation of tile's Bounding Volumes
 * @param {object} tile
 * @param {array} tileWarnings
 * @returns {void}
 */
function checkBoundingVolumes(tile, tileWarnings) {
  if (!tile.parent) {
    return;
  }

  const boundingType = getBoundingType(tile);

  switch (boundingType) {
    case OBB: {
      validateObb(tile, tileWarnings);
      break;
    }
    case MBS: {
      validateMbs(tile, tileWarnings);
      break;
    }
    default:
      console.warn('Validator - Not supported Bounding Volume Type'); //eslint-disable-line
  }
}

/**
 * Do validation of tile OBB
 * @param {object} tile
 * @param {array} tileWarnings
 * @returns {void}
 * Check if child OBB inside parent OBB
 */
function validateObb(tile, tileWarnings) {
  const parentObb = createBoundingBoxFromTileObb(tile.parent.header.obb);
  const tileVertices = getTileObbVertices(tile);
  const isTileObbInsideParentObb = isAllVerticesInsideBoundingVolume(parentObb, tileVertices);

  if (isTileObbInsideParentObb) {
    return;
  }

  const title = `OBB of Tile (${tile.id}) doesn't fit into Parent (${tile.parent.id}) tile OBB`;
  tileWarnings.push({type: BOUNDING_VOLUME_WARNING_TYPE, title});
}

/**
 * Do validation of tile MBS
 * @param {object} tile
 * @param {array} tileWarnings
 * @returns {void}
 * Check if child MBS inside parent MBS
 */
function validateMbs(tile, tileWarnings) {
  const tileMbs = createBoundingSphereFromTileMbs(tile.header.mbs);
  const parentMbs = createBoundingSphereFromTileMbs(tile.parent.header.mbs);
  const distanceBetweenCenters = tileMbs.center.distanceTo(parentMbs.center);

  if (distanceBetweenCenters + tileMbs.radius > parentMbs.radius) {
    const title = `MBS of Tile (${tile.id}) doesn't fit into Parent (${tile.parent.id}) tile MBS`;
    tileWarnings.push({type: BOUNDING_VOLUME_WARNING_TYPE, title});
  }
}

/**
 * Generates BoundingSphere from tile mbs data
 * @param {array} mbs
 * @returns {BoundingSphere}
 */
function createBoundingSphereFromTileMbs(mbs) {
  return new BoundingSphere([mbs[0], mbs[1], mbs[2]], mbs[3]);
}

/**
 * Generates OrientedBoundingBox from tile obb data
 * @param {array} obb
 * @returns {OrientedBoundingBox}
 */
function createBoundingBoxFromTileObb(obb) {
  const {center, halfSize, quaternion} = obb;
  return new OrientedBoundingBox().fromCenterHalfSizeQuaternion(center, halfSize, quaternion);
}

/**
 * Check LOD value of tile
 * @param {object} tile
 * @param {array} tileWarnings
 * @returns {void}
 * LOD spec https://github.com/Esri/i3s-spec/blob/master/format/LevelofDetail.md
 */
function checkLOD(tile, tileWarnings) {
  const divergence = 0.05;
  const tileLodRatio = tile.lodMetricValue / tile.boundingVolume.radius;
  const parentLodRatio = tile.parent.lodMetricValue / tile.parent.boundingVolume.radius;
  const lodRatios = tile.parent.children.map(child => {
    return child.lodMetricValue / child.boundingVolume.radius;
  });
  const meanRatio = lodRatios.reduce((accum, current) => accum + current, 0) / lodRatios.length;

  if (
    meanRatio < parentLodRatio &&
    !tileWarnings.find(
      warning => warning.tileId === tile.parent.id && warning.type === PARENT_LOD_WARNING_TYPE
    )
  ) {
    const title = `Tile (${tile.parent.id}) LOD/Radius ratio "${parentLodRatio}" > mean child LOD/Radius ratio "${meanRatio}"`;
    tileWarnings.push({type: PARENT_LOD_WARNING_TYPE, title, tileId: tile.parent.id});
  }

  if (Math.abs(tileLodRatio - meanRatio) > divergence) {
    const title = `Tile (${tile.id}) LOD/Radius ratio "${tileLodRatio}" has large deviation from mean LOD/Radius ratio of neighbors "${meanRatio}"`;
    tileWarnings.push({type: LOD_WARNING_TYPE, title, tileId: tile.parent.id});
  }
}

/**
 * Calculate texture size of tile
 * @param {object} tile
 * @returns {number}
 */
function getTextureSize(tile) {
  if (!tile.content) {
    return 0;
  }
  const texture =
    (tile.content.material &&
      tile.content.material.pbrMetallicRoughness &&
      tile.content.material.pbrMetallicRoughness.baseColorTexture &&
      tile.content.material.pbrMetallicRoughness.baseColorTexture.texture.source.image) ||
    tile.content.texture ||
    null;
  if (!texture) {
    return 0;
  }
  return texture.height * texture.width;
}

/**
 * Calculate triangle vertices of tile
 * @param {object} attribute
 * @param {number} offset
 * @returns {number}
 */
function getTriangleVertices(attribute, offset) {
  const geometryVertices = [];
  for (let i = 0; i < 3; i++) {
    const typedArray = new attribute.value.constructor(3);
    const subarray = attribute.value.subarray(
      (offset + i) * attribute.size,
      (offset + i) * attribute.size + attribute.size
    );
    typedArray.set(subarray);
    geometryVertices.push(new Vector3(typedArray));
  }
  return geometryVertices;
}

/**
 * Calculates triangles area based on vertices
 * @param {array} vertices
 * @returns {number}
 */
function getTriangleArea(vertices) {
  const edge1 = new Vector3(vertices[0].x, vertices[0].y, vertices[0].z).subtract(vertices[1]);
  const edge2 = new Vector3(vertices[1].x, vertices[1].y, vertices[1].z).subtract(vertices[2]);
  const angle = edge1.angle(edge2);
  const area = 0.5 * edge1.magnitude() * edge2.magnitude() * Math.sin(angle);

  return area;
}

/**
 * Calculates  obb vertices of tile
 * @param {object} tile
 * @returns {number[]}
 */
function getTileObbVertices(tile) {
  const geometry = new CubeGeometry();
  const halfSize = tile.header.obb.halfSize;
  const {attributes} = geometry;
  const positions = new Float32Array(attributes.POSITION.value);
  const obbCenterCartesian = Ellipsoid.WGS84.cartographicToCartesian(tile.header.obb.center);

  let vertices = [];

  for (let i = 0; i < positions.length; i += 3) {
    const positionsVector = new Vector3(
      (positions[i] *= halfSize[0]),
      (positions[i + 1] *= halfSize[1]),
      (positions[i + 2] *= halfSize[2])
    );
    const rotatedPositions = positionsVector
      .transformByQuaternion(tile.header.obb.quaternion)
      .add(obbCenterCartesian);
    vertices = vertices.concat(rotatedPositions);
  }

  return vertices;
}

/**
 * Check if provided vertices are inside bounding volume
 * @param {OrientedBoundingBox | BoundingSphere} boundingVolume
 * @param {array} positions
 * @returns {boolean}
 */
function isAllVerticesInsideBoundingVolume(boundingVolume, positions) {
  let isVerticesInsideObb = true;

  for (let index = 0; index < positions.length / 3; index += 3) {
    const point = [positions[index], positions[index + 1], positions[index + 2]];
    const cartographicPoint = Ellipsoid.WGS84.cartesianToCartographic(point);
    // If point inside sphere then distance is NaN because of sqrt of negative value.
    // If point inside box then distance is 0.
    const distance = boundingVolume.distanceTo(cartographicPoint);

    if (distance > 0) {
      isVerticesInsideObb = false;
      break;
    }
  }

  return isVerticesInsideObb;
}

/**
 * Check if geometry of tile inside bounding volume
 * @param {object} tile
 * @returns {boolean}
 */
export function isTileGeometryInsideBoundingVolume(tile) {
  try {
    const tileData = getTileDataForValidation(tile);
    const {positions, boundingVolume} = tileData;

    return isAllVerticesInsideBoundingVolume(boundingVolume, positions);
  } catch (error) {
    throw error;
  }
}

/**
 * Check if bounding volume made of geometry is more suitable than tile bounding volume
 * @param {object} tile
 * @returns {boolean}
 */
export function isGeometryBoundingVolumeMoreSuitable(tile) {
  try {
    const tileData = getTileDataForValidation(tile);
    const {positions, boundingVolume, boundingType} = tileData;
    const cartographicPositions = convertPositionsToVectors(positions);

    if (boundingType === OBB) {
      const geometryObb = makeOrientedBoundingBoxFromPoints(
        cartographicPositions,
        new OrientedBoundingBox()
      );
      const geometryObbVolume = geometryObb.halfSize.reduce(
        (result, halfSize) => result * halfSize
      );
      const tileObbVolume = boundingVolume.halfSize.reduce((result, halfSize) => result * halfSize);
      return geometryObbVolume < tileObbVolume;
    }

    const geometrySphere = makeBoundingSphereFromPoints(
      cartographicPositions,
      new BoundingSphere()
    );

    return geometrySphere.radius < boundingVolume.radius;
  } catch (error) {
    throw error;
  }
}

/**
 * Generates data for tile validation
 * @param {object} tile
 * @returns {object} - {positions, boundingType, boundingVolume}
 */
function getTileDataForValidation(tile) {
  if (!tile.content && !tile.content.attributes && !tile.content.attributes.POSITION) {
    throw new Error('Validator - There are no positions in tile');
  }

  const boundingType = getBoundingType(tile);
  const positions = tile.content.attributes.positions.value;

  try {
    const boundingVolume = createBoundingVolumeFromTile(tile, boundingType);
    return {positions, boundingType, boundingVolume};
  } catch (error) {
    throw error;
  }
}

/**
 * Generates needed bounding volume from tile bounding volume
 * @param {object} tile
 * @param {string} boundingType
 * @returns {BoundingSphere | OrientedBoundingBox}
 */
function createBoundingVolumeFromTile(tile, boundingType) {
  switch (boundingType) {
    case OBB: {
      return createBoundingBoxFromTileObb(tile.header.obb);
    }
    case MBS: {
      return createBoundingSphereFromTileMbs(tile.header.mbs);
    }
    default:
      throw new Error('Validator - Not supported Bounding Volume Type');
  }
}

/**
 * Create array of posisitons where each vertex is vector
 * @param {array} positions
 * @returns {Vector3[]}
 */
function convertPositionsToVectors(positions) {
  const result = [];

  for (let i = 0; i < positions.length; i += 3) {
    const positionVector = new Vector3(positions[i], positions[i + 1], positions[i + 2]);
    result.push(positionVector);
  }

  return result;
}
