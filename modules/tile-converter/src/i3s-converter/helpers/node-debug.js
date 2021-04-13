import {OrientedBoundingBox, BoundingSphere} from '@math.gl/culling';
import {CubeGeometry} from '@luma.gl/engine';
import {Vector3} from 'math.gl';
import {Ellipsoid} from '@math.gl/geospatial';

// TODO Unite Tile validation logic in i3s-17-and-debug with this code.
export function validateNodeBoundingVolumes(node) {
  if (!node.parentNode.obb || !node.parentNode.mbs) {
    return null;
  }
  const tileWarnings = [];

  validateObb(tileWarnings, node);
  validateMbs(tileWarnings, node);

  return tileWarnings;
}

function validateObb(tileWarnings, node) {
  const parentObb = createBoundingBoxFromTileObb(node.parentNode.obb);
  const tileVertices = getTileObbVertices(node);
  const isTileObbInsideParentObb = isAllVerticesInsideBoundingVolume(parentObb, tileVertices);

  if (isTileObbInsideParentObb) {
    return;
  }

  const title = `OBB of Tile (${node.id}) doesn't fit into Parent (${node.parentNode.id}) tile OBB`;
  tileWarnings.push(title);
}

function validateMbs(tileWarnings, node) {
  const tileMbs = createBoundingSphereFromTileMbs(node.mbs);
  const parentMbs = createBoundingSphereFromTileMbs(node.parentNode.mbs);
  const distanceBetweenCenters = tileMbs.center.distanceTo(parentMbs.center);

  if (distanceBetweenCenters + tileMbs.radius > parentMbs.radius) {
    const title = `MBS of Tile (${node.id}) doesn't fit into Parent (${
      node.parentNode.id
    }) tile MBS`;
    tileWarnings.push(title);
  }
}

function createBoundingSphereFromTileMbs(mbs) {
  return new BoundingSphere([mbs[0], mbs[1], mbs[2]], mbs[3]);
}

function createBoundingBoxFromTileObb(obb) {
  const {center, halfSize, quaternion} = obb;
  return new OrientedBoundingBox().fromCenterHalfSizeQuaternion(center, halfSize, quaternion);
}

// TODO check if Obb generates properly
function getTileObbVertices(node) {
  const geometry = new CubeGeometry();
  const halfSize = node.obb.halfSize;
  const {attributes} = geometry;
  const positions = new Float32Array(attributes.POSITION.value);
  const obbCenterCartesian = Ellipsoid.WGS84.cartographicToCartesian(node.obb.center);

  let vertices = [];

  for (let i = 0; i < positions.length; i += 3) {
    const positionsVector = new Vector3(
      (positions[i] *= halfSize[0]),
      (positions[i + 1] *= halfSize[1]),
      (positions[i + 2] *= halfSize[2])
    );
    const rotatedPositions = positionsVector
      .transformByQuaternion(node.obb.quaternion)
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
