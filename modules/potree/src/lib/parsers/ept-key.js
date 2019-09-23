// This file is derived from the potree code base under BSD 2-clause license
// https://github.com/potree/potree/blob/develop/src/PointCloudEptGeometry.js
// Original Author: connormanning

export default class EPTKey {
  // eslint-disable-next-line max-params
  constructor(ept, b, d, x, y, z) {
    this.ept = ept;
    this.b = b;
    this.d = d;
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
  }

  name() {
    return `${this.d}-${this.x}-${this.y}-${this.z}`;
  }

  step(a, b, c) {
    const min = this.b.min.clone();
    const max = this.b.max.clone();
    const dst = null; // new THREE.Vector3().subVectors(max, min);

    if (a) {
      min.x += dst.x / 2;
    } else {
      max.x -= dst.x / 2;
    }

    if (b) {
      min.y += dst.y / 2;
    } else {
      max.y -= dst.y / 2;
    }

    if (c) {
      min.z += dst.z / 2;
    } else {
      max.z -= dst.z / 2;
    }

    return new EPTKey(
      this.ept,
      null, // new THREE.Box3(min, max),
      this.d + 1,
      this.x * 2 + a,
      this.y * 2 + b,
      this.z * 2 + c
    );
  }

  children() {
    let result = [];
    for (let a = 0; a < 2; ++a) {
      for (let b = 0; b < 2; ++b) {
        for (let c = 0; c < 2; ++c) {
          const add = this.step(a, b, c).name();
          // eslint-disable-next-line max-depth
          if (!result.includes(add)) {
            result = result.concat(add);
          }
        }
      }
    }
    return result;
  }
}
