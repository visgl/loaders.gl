import {OrientedBoundingBox} from '@math.gl/culling';
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

  checkBoundingVolumes(tileWarnings, tile);
  checkLOD(tileWarnings, tile);
  checkGeometryVsTexture(tileWarnings, tile);

  return tileWarnings;
}

function checkBoundingVolumes(tileWarnings, tile) {
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
  if (!tile.parent) {
    return;
  }

  const parentObb = getParentObb(tile);
  const tileVertices = getTileObbVertices(tile);
  const isTileObbInsideParentObb = isAllObbVerticesInsideParentObb(parentObb, tileVertices);

  if (isTileObbInsideParentObb) {
    return;
  }

  const title = `OBB of ${tile.id} tile doesn't fit into ${tile.parent.id} parent tile OBB`;
  tileWarnings.push({id: tile.id, type: BOUNDING_VOLUME_WARNING_TYPE, title});
}

function validateMbs(tileWarnings, tile) {
  // TODO MBS Validation
  return;
}

// LOD spec https://github.com/Esri/i3s-spec/blob/master/format/LevelofDetail.md
function checkLOD(tileWarnings, tile) {
  const parentLod = tile.parent && tile.parent.lodMetricValue;

  if (!parentLod || tile.lodMetricValue > parentLod) {
    return;
  }

  const title = `${tile.id} tile LOD ${tile.lodMetricValue} < parent ${tile.parent.id} tile ${
    tile.parent.lodMetricValue
  } LOD`;
  tileWarnings.push({id: tile.id, type: LOD_WARNING_TYPE, title});
}

function checkGeometryVsTexture(tileWarnings, tile) {
  // TODO Geometry vs Texture Validation
  return;
}

function getParentObb(tile) {
  const {center, halfSize, quaternion} = tile.parent.header.obb;

  return new OrientedBoundingBox().fromCenterHalfSizeQuaternion(center, halfSize, quaternion);
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

function isAllObbVerticesInsideParentObb(parentObb, tilePositions) {
  let isTileObbInsideParent = true;

  for (let index = 0; index < tilePositions.length / 3; index += 3) {
    const point = [tilePositions[index], tilePositions[index + 1], tilePositions[index + 2]];
    const cartographicPoint = Ellipsoid.WGS84.cartesianToCartographic(point);
    const distance = parentObb.distanceTo(cartographicPoint);

    if (distance > 0) {
      isTileObbInsideParent = false;
      break;
    }
  }

  return isTileObbInsideParent;
}
