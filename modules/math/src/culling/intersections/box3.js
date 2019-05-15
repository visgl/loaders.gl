// The MIT License
//
// Copyright © 2010-2018 three.js authors
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

// @author bhouston / http://clara.io
// @author WestLangley / http://github.com/WestLangley

/* eslint-disable */
import Vector3 from '../vector3';

const v1 = new Vector3();

const points = [
  new Vector3(),
  new Vector3(),
  new Vector3(),
  new Vector3(),
  new Vector3(),
  new Vector3(),
  new Vector3(),
  new Vector3()
];

export default class Box3 {
  constructor(min, max) {
    this.min =
      min !== undefined ? min : new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
    this.max =
      max !== undefined ? max : new Vector3(Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE);
  }

  clone() {
    return new this.constructor().copy(this);
  }

  copy(box) {
    this.min.copy(box.min);
    this.max.copy(box.max);
    return this;
  }

  equals(box) {
    return box.min.equals(this.min) && box.max.equals(this.max);
  }

  get isBox3() {
    return true;
  }

  makeEmpty() {
    this.min.x = this.min.y = this.min.z = Number.MAX_VALUE;
    this.max.x = this.max.y = this.max.z = Number.MIN_VALUE;
    return this;
  }

  set(min, max) {
    this.min.copy(min);
    this.max.copy(max);
    return this;
  }

  setFromArray(array) {
    let minX = Number.MAX_VALUE;
    let minY = Number.MAX_VALUE;
    let minZ = Number.MAX_VALUE;

    let maxX = Number.MIN_VALUE;
    let maxY = Number.MIN_VALUE;
    let maxZ = Number.MIN_VALUE;

    for (let i = 0, l = array.length; i < l; i += 3) {
      const x = array[i];
      const y = array[i + 1];
      const z = array[i + 2];

      if (x < minX) {
        minX = x;
      }
      if (y < minY) {
        minY = y;
      }
      if (z < minZ) {
        minZ = z;
      }

      if (x > maxX) {
        maxX = x;
      }
      if (y > maxY) {
        maxY = y;
      }
      if (z > maxZ) {
        maxZ = z;
      }
    }

    this.min.set(minX, minY, minZ);
    this.max.set(maxX, maxY, maxZ);
    return this;
  }

  setFromArray({array, elements, size = 3}) {
    const length = elements !== undefined ? elements * size : array.length;

    let minX = Number.MAX_VALUE;
    let minY = Number.MAX_VALUE;
    let minZ = Number.MAX_VALUE;

    let maxX = Number.MIN_VALUE;
    let maxY = Number.MIN_VALUE;
    let maxZ = Number.MIN_VALUE;

    for (let i = 0, l = attribute.count; i < l; i++) {
      const x = attribute.getX(i);
      const y = attribute.getY(i);
      const z = size > 2 && attribute.getZ(i);

      if (x < minX) {
        minX = x;
      }
      if (y < minY) {
        minY = y;
      }
      if (z < minZ) {
        minZ = z;
      }

      if (x > maxX) {
        maxX = x;
      }
      if (y > maxY) {
        maxY = y;
      }
      if (z > maxZ) {
        maxZ = z;
      }

      i += size;
    }

    this.min.set(minX, minY, minZ);
    this.max.set(maxX, maxY, maxZ);
    return this;
  }

  setFromPoints(points) {
    this.makeEmpty();
    for (let i = 0, il = points.length; i < il; i++) {
      this.expandByPoint(points[i]);
    }
    return this;
  }

  setFromCenterAndSize(center, size) {
    const halfSize = v1.copy(size).multiplyScalar(0.5);
    this.min.copy(center).sub(halfSize);
    this.max.copy(center).add(halfSize);
    return this;
  }

  intersect(box) {
    this.min.max(box.min);
    this.max.min(box.max);
    // ensure that if there is no overlap, the result is fully empty,
    // not slightly empty with non-inf/+inf values that will cause subsequence
    // intersects to erroneously return valid values.
    if (this.isEmpty()) {
      this.makeEmpty();
    }
    return this;
  }

  union(box) {
    this.min.min(box.min);
    this.max.max(box.max);
    return this;
  }

  expandByPoint(point) {
    this.min.min(point);
    this.max.max(point);
    return this;
  }

  expandByVector(vector) {
    this.min.sub(vector);
    this.max.add(vector);
    return this;
  }

  expandByScalar(scalar) {
    this.min.addScalar(-scalar);
    this.max.addScalar(scalar);
    return this;
  }

  translate(offset) {
    this.min.add(offset);
    this.max.add(offset);
    return this;
  }

  applyMatrix4(matrix) {
    // transform of empty box is an empty box.
    if (!this.isEmpty()) {
      // NOTE: using a binary pattern to specify all 2^3 combinations below
      points[0].set(this.min.x, this.min.y, this.min.z).applyMatrix4(matrix); // 000
      points[1].set(this.min.x, this.min.y, this.max.z).applyMatrix4(matrix); // 001
      points[2].set(this.min.x, this.max.y, this.min.z).applyMatrix4(matrix); // 010
      points[3].set(this.min.x, this.max.y, this.max.z).applyMatrix4(matrix); // 011
      points[4].set(this.max.x, this.min.y, this.min.z).applyMatrix4(matrix); // 100
      points[5].set(this.max.x, this.min.y, this.max.z).applyMatrix4(matrix); // 101
      points[6].set(this.max.x, this.max.y, this.min.z).applyMatrix4(matrix); // 110
      points[7].set(this.max.x, this.max.y, this.max.z).applyMatrix4(matrix); // 111
      this.setFromPoints(points);
    }
    return this;
  }

  // ACCESSORS

  // this is a more robust check for empty than (volume <= 0)
  // because volume can get positive with two negative axes
  isEmpty() {
    return this.max.x < this.min.x || this.max.y < this.min.y || this.max.z < this.min.z;
  }

  getCenter(target = new Vector3()) {
    return this.isEmpty()
      ? target.set(0, 0, 0)
      : target.addVectors(this.min, this.max).multiplyScalar(0.5);
  }

  getSize(target = new Vector3()) {
    return this.isEmpty() ? target.set(0, 0, 0) : target.subVectors(this.max, this.min);
  }

  containsPoint(point) {
    return !(
      point.x < this.min.x ||
      point.x > this.max.x ||
      point.y < this.min.y ||
      point.y > this.max.y ||
      point.z < this.min.z ||
      point.z > this.max.z
    );
  }

  containsBox(box) {
    return (
      this.min.x <= box.min.x &&
      box.max.x <= this.max.x &&
      this.min.y <= box.min.y &&
      box.max.y <= this.max.y &&
      this.min.z <= box.min.z &&
      box.max.z <= this.max.z
    );
  }

  clampPoint(point, target = new Vector3()) {
    return target.copy(point).clamp(this.min, this.max);
  }

  distanceToPoint(point) {
    const clampedPoint = v1.copy(point).clamp(this.min, this.max);
    return clampedPoint.sub(point).length();
  }

  intersectsBox(box) {
    // using 6 splitting planes to rule out intersections.
    return !(
      box.max.x < this.min.x ||
      box.min.x > this.max.x ||
      box.max.y < this.min.y ||
      box.min.y > this.max.y ||
      box.max.z < this.min.z ||
      box.min.z > this.max.z
    );
  }

  // UNDECIDED METHODS

  /*
  expandByObject() {
    // Computes the world-axis-aligned bounding box of an object (including its children),
    // accounting for both the object's, and children's, world transforms
    let scope, i, l;

    const v1 = new Vector3();

    function traverse(node) {

      const geometry = node.geometry;

      if (geometry !== undefined) {
        if (geometry.isGeometry) {
          const vertices = geometry.vertices;
          for (i = 0, l = vertices.length; i < l; i ++) {
            v1.copy(vertices[i]);
            v1.applyMatrix4(node.matrixWorld);
            scope.expandByPoint(v1);
          }
        } else if (geometry.isBufferGeometry) {
          const attribute = geometry.attributes.position;
          if (attribute !== undefined) {
            for (i = 0, l = attribute.count; i < l; i ++) {
              v1.fromBufferAttribute(attribute, i).applyMatrix4(node.matrixWorld);
              scope.expandByPoint(v1);
            }
          }
        }
      }
    }

    return function expandByObject(object) {
      scope = this;
      object.updateMatrixWorld(true);
      object.traverse(traverse);
      return this;
    };
  }(),

  // This can potentially have a divide by zero if the box
  // has a size dimension of 0.
  getParameter(point, target = new Vector3()) {
    return target.set(
      (point.x - this.min.x) / (this.max.x - this.min.x),
      (point.y - this.min.y) / (this.max.y - this.min.y),
      (point.z - this.min.z) / (this.max.z - this.min.z)
    );
  }
  */
}
