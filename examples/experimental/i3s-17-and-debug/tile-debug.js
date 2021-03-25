import {OrientedBoundingBox} from '@math.gl/culling';

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
