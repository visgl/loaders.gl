import type {Mbs, Node3DIndexDocument, Obb} from '@loaders.gl/i3s';
import {OrientedBoundingBox, BoundingSphere} from '@math.gl/culling';
import {Vector3} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';

// prettier-ignore
const CUBE_POSITIONS = new Float32Array([
  -1,  -1,  1, 1,  -1,  1,  1,  1,  1,  -1,  1,  1,
  -1,  -1,  -1,  -1,  1,  -1,  1,  1,  -1,  1,  -1,  -1,
  -1,  1,  -1,  -1,  1,  1,  1,  1,  1,  1,  1,  -1,
  -1,  -1,  -1,  1,  -1,  -1,  1,  -1,  1,  -1,  -1,  1,
  1,  -1,  -1,  1,  1,  -1,  1,  1,  1,  1,  -1,  1,
  -1,  -1,  -1,  -1,  -1,  1,  -1,  1,  1,  -1,  1,  -1
]);

// TODO Unite Tile validation logic in i3s-17-and-debug with this code.

/**
 * Do validation of bounding volumes for particular node.
 * Generates special warnings if there are some issues.
 * @param node
 */
export function validateNodeBoundingVolumes(node: Node3DIndexDocument): string[] {
  if (!node?.parentNode?.obb || !node?.parentNode?.mbs) {
    return [];
  }

  const tileWarnings: string[] = [];

  validateObb(tileWarnings, node);
  validateMbs(tileWarnings, node);

  return tileWarnings;
}

/**
 * Check if child Obb fit into parent Obb.
 * @param tileWarnings
 * @param node
 */
function validateObb(tileWarnings: string[], node: Node3DIndexDocument): void {
  // @ts-expect-error
  const parentObb = createBoundingBoxFromTileObb(node.parentNode.obb);
  const tileVertices = getTileObbVertices(node);
  const isTileObbInsideParentObb = isAllVerticesInsideBoundingVolume(parentObb, tileVertices);

  if (isTileObbInsideParentObb) {
    return;
  }

  const title = `OBB of Tile (${node.id}) doesn't fit into Parent (${node.parentNode?.id}) tile OBB`;
  tileWarnings.push(title);
}

/**
 * Check if child Mbs fit into parent Mbs.
 * @param tileWarnings
 * @param node
 */
function validateMbs(tileWarnings: string[], node: Node3DIndexDocument): void {
  // @ts-expect-error
  const tileMbs = createBoundingSphereFromTileMbs(node.mbs);
  // @ts-expect-error
  const parentMbs = createBoundingSphereFromTileMbs(node.parentNode.mbs);
  const distanceBetweenCenters = tileMbs.center.distanceTo(parentMbs.center);

  if (distanceBetweenCenters + tileMbs.radius > parentMbs.radius) {
    const title = `MBS of Tile (${node.id}) doesn't fit into Parent (${node.parentNode?.id}) tile MBS`;
    tileWarnings.push(title);
  }
}

/**
 * Generates bounding sphere from mbs
 * @param mbs
 */
function createBoundingSphereFromTileMbs(mbs: Mbs): BoundingSphere {
  return new BoundingSphere([mbs[0], mbs[1], mbs[2]], mbs[3]);
}

/**
 * Generates oriented bounding box from tile obb
 * @param obb
 * @returns
 */
function createBoundingBoxFromTileObb(obb: Obb): OrientedBoundingBox {
  const {center, halfSize, quaternion} = obb;
  return new OrientedBoundingBox().fromCenterHalfSizeQuaternion(center, halfSize, quaternion);
}

/**
 * Get vertices fromnode obb
 * TODO check if Obb generates properly
 * @param node
 */
function getTileObbVertices(node: Node3DIndexDocument): number[] {
  // @ts-expect-error
  const halfSize = node.obb.halfSize;
  const positions = CUBE_POSITIONS;
  // @ts-expect-error
  const obbCenterCartesian = Ellipsoid.WGS84.cartographicToCartesian(node.obb.center);

  let vertices = [];

  for (let i = 0; i < positions.length; i += 3) {
    const positionsVector = new Vector3(
      (positions[i] *= halfSize[0]),
      (positions[i + 1] *= halfSize[1]),
      (positions[i + 2] *= halfSize[2])
    );
    const rotatedPositions = positionsVector
      // @ts-expect-error
      .transformByQuaternion(node.obb.quaternion)
      .add(obbCenterCartesian);
    // @ts-expect-error
    vertices = vertices.concat(rotatedPositions);
  }

  return vertices;
}

/**
 * Check if all vertices inside bounding volume
 * @param boundingVolume
 * @param positions
 */
function isAllVerticesInsideBoundingVolume(
  boundingVolume: OrientedBoundingBox,
  positions: number[]
): boolean {
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
