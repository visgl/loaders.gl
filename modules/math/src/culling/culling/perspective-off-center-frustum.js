/* eslint-disable */
import {Vector3, Vector4, Matrix4} from 'math.gl';
import CullingVolume from './culling-volume';

const getPlanesRight = new Vector3();
const getPlanesNearCenter = new Vector3();
const getPlanesFarCenter = new Vector3();
const getPlanesNormal = new Vector3();

export default class PerspectiveOffCenterFrustum {
  /**
   * The viewing frustum is defined by 6 planes.
   * Each plane is represented by a {@link Vector4} object, where the x, y, and z components
   * define the unit vector normal to the plane, and the w component is the distance of the
   * plane from the origin/camera position.
   *
   * @alias PerspectiveOffCenterFrustum
   * @constructor
   *
   * @param {Object} [options] An object with the following properties:
   * @param {Number} [options.left] The left clipping plane distance.
   * @param {Number} [options.right] The right clipping plane distance.
   * @param {Number} [options.top] The top clipping plane distance.
   * @param {Number} [options.bottom] The bottom clipping plane distance.
   * @param {Number} [options.near=1.0] The near clipping plane distance.
   * @param {Number} [options.far=500000000.0] The far clipping plane distance.
   *
   * @example
   * const frustum = new Cesium.PerspectiveOffCenterFrustum({
   *     left : -1.0,
   *     right : 1.0,
   *     top : 1.0,
   *     bottom : -1.0,
   *     near : 1.0,
   *     far : 100.0
   * });
   *
   * @see PerspectiveFrustum
   */
  constructor(options = {}) {
    /**
     * Defines the left clipping plane.
     * @type {Number}
     * @default undefined
     */
    this.left = options.left;
    this._left = undefined;

    /**
     * Defines the right clipping plane.
     * @type {Number}
     * @default undefined
     */
    this.right = options.right;
    this._right = undefined;

    /**
     * Defines the top clipping plane.
     * @type {Number}
     * @default undefined
     */
    this.top = options.top;
    this._top = undefined;

    /**
     * Defines the bottom clipping plane.
     * @type {Number}
     * @default undefined
     */
    this.bottom = options.bottom;
    this._bottom = undefined;

    /**
     * The distance of the near plane.
     * @type {Number}
     * @default 1.0
     */
    this.near = defaultValue(options.near, 1.0);
    this._near = this.near;

    /**
     * The distance of the far plane.
     * @type {Number}
     * @default 500000000.0
     */
    this.far = defaultValue(options.far, 500000000.0);
    this._far = this.far;

    this._cullingVolume = new CullingVolume();
    this._perspectiveMatrix = new Matrix4();
    this._infinitePerspective = new Matrix4();
  }

  /**
   * Gets the perspective projection matrix computed from the view frustum.
   * @memberof PerspectiveOffCenterFrustum.prototype
   * @type {Matrix4}
   * @readonly
   *
   * @see PerspectiveOffCenterFrustum#infiniteProjectionMatrix
   */
  get projectionMatrix() {
    update(this);
    return this._perspectiveMatrix;
  }

  /**
   * Gets the perspective projection matrix computed from the view frustum with an infinite far plane.
   * @memberof PerspectiveOffCenterFrustum.prototype
   * @type {Matrix4}
   * @readonly
   *
   * @see PerspectiveOffCenterFrustum#projectionMatrix
   */
  get infiniteProjectionMatrix() {
    update(this);
    return this._infinitePerspective;
  }

  /**
   * Creates a culling volume for this frustum.
   *
   * @param {Vector3} position The eye position.
   * @param {Vector3} direction The view direction.
   * @param {Vector3} up The up direction.
   * @returns {CullingVolume} A culling volume at the given position and orientation.
   *
   * @example
   * // Check if a bounding volume intersects the frustum.
   * const cullingVolume = frustum.computeCullingVolume(cameraPosition, cameraDirection, cameraUp);
   * const intersect = cullingVolume.computeVisibility(boundingVolume);
   */
  computeCullingVolume(position, direction, up) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(position)) {
      throw new DeveloperError('position is required.');
    }

    if (!defined(direction)) {
      throw new DeveloperError('direction is required.');
    }

    if (!defined(up)) {
      throw new DeveloperError('up is required.');
    }
    //>>includeEnd('debug');

    const planes = this._cullingVolume.planes;

    const t = this.top;
    const b = this.bottom;
    const r = this.right;
    const l = this.left;
    const n = this.near;
    const f = this.far;

    const right = Vector3.cross(direction, up, getPlanesRight);

    const nearCenter = getPlanesNearCenter;
    Vector3.multiplyByScalar(direction, n, nearCenter);
    Vector3.add(position, nearCenter, nearCenter);

    const farCenter = getPlanesFarCenter;
    Vector3.multiplyByScalar(direction, f, farCenter);
    Vector3.add(position, farCenter, farCenter);

    const normal = getPlanesNormal;

    //Left plane computation
    Vector3.multiplyByScalar(right, l, normal);
    Vector3.add(nearCenter, normal, normal);
    Vector3.subtract(normal, position, normal);
    Vector3.normalize(normal, normal);
    Vector3.cross(normal, up, normal);
    Vector3.normalize(normal, normal);

    const plane = planes[0];
    if (!defined(plane)) {
      plane = planes[0] = new Vector4();
    }
    plane.x = normal.x;
    plane.y = normal.y;
    plane.z = normal.z;
    plane.w = -Vector3.dot(normal, position);

    //Right plane computation
    Vector3.multiplyByScalar(right, r, normal);
    Vector3.add(nearCenter, normal, normal);
    Vector3.subtract(normal, position, normal);
    Vector3.cross(up, normal, normal);
    Vector3.normalize(normal, normal);

    plane = planes[1];
    if (!defined(plane)) {
      plane = planes[1] = new Vector4();
    }
    plane.x = normal.x;
    plane.y = normal.y;
    plane.z = normal.z;
    plane.w = -Vector3.dot(normal, position);

    //Bottom plane computation
    Vector3.multiplyByScalar(up, b, normal);
    Vector3.add(nearCenter, normal, normal);
    Vector3.subtract(normal, position, normal);
    Vector3.cross(right, normal, normal);
    Vector3.normalize(normal, normal);

    plane = planes[2];
    if (!defined(plane)) {
      plane = planes[2] = new Vector4();
    }
    plane.x = normal.x;
    plane.y = normal.y;
    plane.z = normal.z;
    plane.w = -Vector3.dot(normal, position);

    //Top plane computation
    Vector3.multiplyByScalar(up, t, normal);
    Vector3.add(nearCenter, normal, normal);
    Vector3.subtract(normal, position, normal);
    Vector3.cross(normal, right, normal);
    Vector3.normalize(normal, normal);

    plane = planes[3];
    if (!defined(plane)) {
      plane = planes[3] = new Vector4();
    }
    plane.x = normal.x;
    plane.y = normal.y;
    plane.z = normal.z;
    plane.w = -Vector3.dot(normal, position);

    //Near plane computation
    plane = planes[4];
    if (!defined(plane)) {
      plane = planes[4] = new Vector4();
    }
    plane.x = direction.x;
    plane.y = direction.y;
    plane.z = direction.z;
    plane.w = -Vector3.dot(direction, nearCenter);

    //Far plane computation
    Vector3.negate(direction, normal);

    plane = planes[5];
    if (!defined(plane)) {
      plane = planes[5] = new Vector4();
    }
    plane.x = normal.x;
    plane.y = normal.y;
    plane.z = normal.z;
    plane.w = -Vector3.dot(normal, farCenter);

    return this._cullingVolume;
  }

  /**
   * Returns the pixel's width and height in meters.
   *
   * @param {Number} drawingBufferWidth The width of the drawing buffer.
   * @param {Number} drawingBufferHeight The height of the drawing buffer.
   * @param {Number} distance The distance to the near plane in meters.
   * @param {Vector2} result The object onto which to store the result.
   * @returns {Vector2} The modified result parameter or a new instance of {@link Vector2} with the pixel's width and height in the x and y properties, respectively.
   *
   * @exception {DeveloperError} drawingBufferWidth must be greater than zero.
   * @exception {DeveloperError} drawingBufferHeight must be greater than zero.
   *
   * @example
   * // Example 1
   * // Get the width and height of a pixel.
   * const pixelSize = camera.frustum.getPixelDimensions(scene.drawingBufferWidth, scene.drawingBufferHeight, 1.0, new Cesium.Vector2());
   *
   * @example
   * // Example 2
   * // Get the width and height of a pixel if the near plane was set to 'distance'.
   * // For example, get the size of a pixel of an image on a billboard.
   * const position = camera.position;
   * const direction = camera.direction;
   * const toCenter = Cesium.Vector3.subtract(primitive.boundingVolume.center, position, new Cesium.Vector3());      // vector from camera to a primitive
   * const toCenterProj = Cesium.Vector3.multiplyByScalar(direction, Cesium.Vector3.dot(direction, toCenter), new Cesium.Vector3()); // project vector onto camera direction vector
   * const distance = Cesium.Vector3.magnitude(toCenterProj);
   * const pixelSize = camera.frustum.getPixelDimensions(scene.drawingBufferWidth, scene.drawingBufferHeight, distance, new Cesium.Vector2());
   */
  getPixelDimensions(drawingBufferWidth, drawingBufferHeight, distance, result) {
    update(this);

    //>>includeStart('debug', pragmas.debug);
    if (!defined(drawingBufferWidth) || !defined(drawingBufferHeight)) {
      throw new DeveloperError('Both drawingBufferWidth and drawingBufferHeight are required.');
    }
    if (drawingBufferWidth <= 0) {
      throw new DeveloperError('drawingBufferWidth must be greater than zero.');
    }
    if (drawingBufferHeight <= 0) {
      throw new DeveloperError('drawingBufferHeight must be greater than zero.');
    }
    if (!defined(distance)) {
      throw new DeveloperError('distance is required.');
    }
    if (!defined(result)) {
      throw new DeveloperError('A result object is required.');
    }
    //>>includeEnd('debug');

    const inverseNear = 1.0 / this.near;
    const tanTheta = this.top * inverseNear;
    const pixelHeight = (2.0 * distance * tanTheta) / drawingBufferHeight;
    tanTheta = this.right * inverseNear;
    const pixelWidth = (2.0 * distance * tanTheta) / drawingBufferWidth;

    result.x = pixelWidth;
    result.y = pixelHeight;
    return result;
  }

  /**
   * Returns a duplicate of a PerspectiveOffCenterFrustum instance.
   *
   * @param {PerspectiveOffCenterFrustum} [result] The object onto which to store the result.
   * @returns {PerspectiveOffCenterFrustum} The modified result parameter or a new PerspectiveFrustum instance if one was not provided.
   */
  clone(result) {
    if (!defined(result)) {
      result = new PerspectiveOffCenterFrustum();
    }

    result.right = this.right;
    result.left = this.left;
    result.top = this.top;
    result.bottom = this.bottom;
    result.near = this.near;
    result.far = this.far;

    // force update of clone to compute matrices
    result._left = undefined;
    result._right = undefined;
    result._top = undefined;
    result._bottom = undefined;
    result._near = undefined;
    result._far = undefined;

    return result;
  }

  /**
   * Compares the provided PerspectiveOffCenterFrustum componentwise and returns
   * <code>true</code> if they are equal, <code>false</code> otherwise.
   *
   * @param {PerspectiveOffCenterFrustum} [other] The right hand side PerspectiveOffCenterFrustum.
   * @returns {Boolean} <code>true</code> if they are equal, <code>false</code> otherwise.
   */
  equals(other) {
    return (
      defined(other) &&
      other instanceof PerspectiveOffCenterFrustum &&
      this.right === other.right &&
      this.left === other.left &&
      this.top === other.top &&
      this.bottom === other.bottom &&
      this.near === other.near &&
      this.far === other.far
    );
  }
}

function update(frustum) {
  //>>includeStart('debug', pragmas.debug);
  if (
    !defined(frustum.right) ||
    !defined(frustum.left) ||
    !defined(frustum.top) ||
    !defined(frustum.bottom) ||
    !defined(frustum.near) ||
    !defined(frustum.far)
  ) {
    throw new DeveloperError('right, left, top, bottom, near, or far parameters are not set.');
  }
  //>>includeEnd('debug');

  const t = frustum.top;
  const b = frustum.bottom;
  const r = frustum.right;
  const l = frustum.left;
  const n = frustum.near;
  const f = frustum.far;

  if (
    t !== frustum._top ||
    b !== frustum._bottom ||
    l !== frustum._left ||
    r !== frustum._right ||
    n !== frustum._near ||
    f !== frustum._far
  ) {
    //>>includeStart('debug', pragmas.debug);
    if (frustum.near <= 0 || frustum.near > frustum.far) {
      throw new DeveloperError('near must be greater than zero and less than far.');
    }
    //>>includeEnd('debug');

    frustum._left = l;
    frustum._right = r;
    frustum._top = t;
    frustum._bottom = b;
    frustum._near = n;
    frustum._far = f;
    frustum._perspectiveMatrix = Matrix4.computePerspectiveOffCenter(
      l,
      r,
      b,
      t,
      n,
      f,
      frustum._perspectiveMatrix
    );
    frustum._infinitePerspective = Matrix4.computeInfinitePerspectiveOffCenter(
      l,
      r,
      b,
      t,
      n,
      frustum._infinitePerspective
    );
  }
}
