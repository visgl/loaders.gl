/* eslint-disable */
import {Vector3} from '@math.gl/core';

/**
 * Setting X, Y, Z for Vector
 * @param normals
 * @param vector
 */
export function normalize(normals: any = {}, vector: Vector3) {
  //@ts-ignore
  normals = this.attributes.normal;
  for (let i = 0, il = normals.count; i < il; i++) {
    vector.x = normals.getX(i);
    vector.y = normals.getY(i);
    vector.z = normals.getZ(i);
    vector.normalize();
    normals.setXYZ(i, vector.x, vector.y, vector.z);
  }
}
