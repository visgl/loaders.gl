import {Matrix3, Quaternion} from '@math.gl/core';

/**
 * Convert obb from i3s format (basen on quaternion) to 3d-tiles format (based on matrix)
 * @param i3sObb obb object based on quaternion https://github.com/Esri/i3s-spec/blob/master/docs/1.7/obb.cmn.md
 */
export function i3sObbTo3dTilesObb(i3sObb) {
  const quaternion = new Quaternion(i3sObb.quaternion);
  const directionsMatrix = new Matrix3().fromQuaternion(quaternion);
  directionsMatrix[0] = directionsMatrix[0] * i3sObb.halfSize[0];
  directionsMatrix[1] = directionsMatrix[1] * i3sObb.halfSize[0];
  directionsMatrix[2] = directionsMatrix[2] * i3sObb.halfSize[0];
  directionsMatrix[3] = directionsMatrix[3] * i3sObb.halfSize[1];
  directionsMatrix[4] = directionsMatrix[4] * i3sObb.halfSize[1];
  directionsMatrix[5] = directionsMatrix[5] * i3sObb.halfSize[1];
  directionsMatrix[6] = directionsMatrix[6] * i3sObb.halfSize[2];
  directionsMatrix[7] = directionsMatrix[7] * i3sObb.halfSize[2];
  directionsMatrix[8] = directionsMatrix[8] * i3sObb.halfSize[2];
  return [...i3sObb.center, ...directionsMatrix.toArray()];
}
