import {OrientedBoundingBox, BoundingSphere} from '@math.gl/culling';
import {CubeGeometry} from '@luma.gl/engine';
import {BOUNDING_VOLUME_WARNING_TYPE, LOD_WARNING_TYPE} from './constants';
import {Vector3} from 'math.gl';
import {Ellipsoid} from '@math.gl/geospatial';

const NO_DATA = 'No Data';
const OBB = 'Oriented Bounding Box';
const MBS = 'Minimum Bounding Sphere';

const REFINEMENT_TYPES = {
  1: 'Add',
  2: 'Replace'
};

export function getShortTileDebugInfo(tileHeader) {
  const clildrenInfo = getChildrenInfo(tileHeader.header.children);

  return {
    ['Tile Id']: tileHeader.id,
    ['Children Count']: clildrenInfo.count,
    ['Children Ids']: clildrenInfo.ids,
    ['Vertex count']: tileHeader.content.vertexCount || NO_DATA,
    ['Distance to camera']: tileHeader._distanceToCamera || NO_DATA
  };
}

export function getTileDebugInfo(tileHeader) {
  return {
    ...getShortTileDebugInfo(tileHeader),
    ['Refinement Type']: REFINEMENT_TYPES[tileHeader.refine] || NO_DATA,
    Type: tileHeader.type || NO_DATA,
    ['Has Texture']: Boolean(tileHeader.content.texture),
    ['Has Material']: Boolean(tileHeader.content.material),
    ['Bounding Type']: getBoundingType(tileHeader),
    ['LOD Metric Type']: tileHeader.lodMetricType || NO_DATA,
    ['LOD Metric Value']: tileHeader.lodMetricValue || NO_DATA,
    ['Screen Space Error']: tileHeader._screenSpaceError || NO_DATA
  };
}

function getBoundingType(tile) {
  if (tile.header.obb || tile.boundingVolume instanceof OrientedBoundingBox) {
    return OBB;
  }
  return MBS;
}

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

export function validateTile(tile) {
  const tileWarnings = [];

  checkBoundingVolumes(tile, tileWarnings);
  checkLOD(tile, tileWarnings);
  checkGeometryVsTexture(tile, tileWarnings);

  return tileWarnings;
}

function checkBoundingVolumes(tile, tileWarnings) {
  if (!tile.parent) {
    return;
  }

  const boundingType = getBoundingType(tile);

  switch (boundingType) {
    case OBB: {
      validateObb(tileWarnings, tile);
      break;
    }
    case MBS: {
      validateMbs(tileWarnings, tile);
      break;
    }
    default:
      console.warn('Validator - Not supported Bounding Volume Type'); //eslint-disable-line
  }
}

function validateObb(tileWarnings, tile) {
  const parentObb = createBoundingBoxFromTileObb(tile.parent.header.obb);
  const tileVertices = getTileObbVertices(tile);
  const isTileObbInsideParentObb = isAllVerticesInsideBoundingVolume(parentObb, tileVertices);

  if (isTileObbInsideParentObb) {
    return;
  }

  const title = `OBB of Tile (${tile.id}) doesn't fit into Parent (${tile.parent.id}) tile OBB`;
  tileWarnings.push({type: BOUNDING_VOLUME_WARNING_TYPE, title});
}

function validateMbs(tileWarnings, tile) {
  const tileMbs = createBoundingSphereFromTileMbs(tile.header.mbs);
  const parentMbs = createBoundingSphereFromTileMbs(tile.parent.header.mbs);
  const distanceBetweenCenters = tileMbs.center.distanceTo(parentMbs.center);

  if (distanceBetweenCenters + tileMbs.radius > parentMbs.radius) {
    const title = `MBS of Tile (${tile.id}) doesn't fit into Parent (${tile.parent.id}) tile MBS`;
    tileWarnings.push({type: BOUNDING_VOLUME_WARNING_TYPE, title});
  }
}

function createBoundingSphereFromTileMbs(mbs) {
  return new BoundingSphere([mbs[0], mbs[1], mbs[2]], mbs[3]);
}

function createBoundingBoxFromTileObb(obb) {
  const {center, halfSize, quaternion} = obb;
  return new OrientedBoundingBox().fromCenterHalfSizeQuaternion(center, halfSize, quaternion);
}

// LOD spec https://github.com/Esri/i3s-spec/blob/master/format/LevelofDetail.md
function checkLOD(tile, tileWarnings) {
  const parentLod = tile.parent && tile.parent.lodMetricValue;

  if (!parentLod || tile.lodMetricValue > parentLod) {
    return;
  }

  const title = `Tile (${tile.id}) LOD = "${tile.lodMetricValue}" < Parent (${
    tile.parent.id
  }) tile LOD = "${tile.parent.lodMetricValue}"`;
  tileWarnings.push({type: LOD_WARNING_TYPE, title});
}

function checkGeometryVsTexture(tile, tileWarnings) {
  // TODO Geometry vs Texture Validation
  return;
}

// TODO check if Obb generates properly
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

function isAllVerticesInsideBoundingVolume(boundingVolume, positions) {
  let isVerticesInsideObb = true;

  for (let index = 0; index < positions.length / 3; index += 3) {
    const point = [positions[index], positions[index + 1], positions[index + 2]];
    const cartographicPoint = Ellipsoid.WGS84.cartesianToCartographic(point);

    const distance = boundingVolume.distanceTo(cartographicPoint);

    if (distance > 0) {
      isVerticesInsideObb = false;
      break;
    }
  }

  return isVerticesInsideObb;
}

export function isTileGeometryInsideBoundingVolume(tile) {
  const boundingType = getBoundingType(tile);
  const positions = tile.content.attributes.positions.value;
  let boundingVolume = null;

  switch (boundingType) {
    case OBB: {
      boundingVolume = createBoundingBoxFromTileObb(tile.header.obb);
      break;
    }
    case MBS: {
      boundingVolume = createBoundingSphereFromTileMbs(tile.header.mbs);
      break;
    }
    default:
      console.error('Validator - Not supported Bounding Volume Type'); //eslint-disable-line
  }

  try {
    return isAllVerticesInsideBoundingVolume(boundingVolume, positions);
  } catch (error) {
    return error;
  }
}
