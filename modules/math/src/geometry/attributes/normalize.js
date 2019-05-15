/* eslint-disable */

export function normalize(normals) {
  var normals = this.attributes.normal;
  for (var i = 0, il = normals.count; i < il; i++) {
    vector.x = normals.getX(i);
    vector.y = normals.getY(i);
    vector.z = normals.getZ(i);
    vector.normalize();
    normals.setXYZ(i, vector.x, vector.y, vector.z);
  }
}
