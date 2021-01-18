/**
 * Code is ported from GeographicLib-1.50.1
 * https://geographiclib.sourceforge.io/html/index.html
 * Location: /GeographicLib-1.50.1/src/Geoid.cpp
 *           /GeographicLib-1.50.1/include/GeographicLib/Geoid.hpp
 *           /GeographicLib-1.50.1/src/Math.cpp
 *
 * File header:
 * * \file Geoid.cpp (Geoid.hpp)
 * * \brief Implementation for GeographicLib::Geoid class
 * *
 * * Copyright (c) Charles Karney (2009-2018) <charles@karney.com> and licensed
 * * under the MIT/X11 License.  For more information, see
 * * https://geographiclib.sourceforge.io/
 **********************************************************************/

const c0_ = 240;

// prettier-ignore
const c3_ = [
  9, -18, -88,    0,  96,   90,   0,   0, -60, -20,
  -9,  18,   8,    0, -96,   30,   0,   0,  60, -20,
  9, -88, -18,   90,  96,    0, -20, -60,   0,   0,
  186, -42, -42, -150, -96, -150,  60,  60,  60,  60,
  54, 162, -78,   30, -24,  -90, -60,  60, -60,  60,
  -9, -32,  18,   30,  24,    0,  20, -60,   0,   0,
  -9,   8,  18,   30, -96,    0, -20,  60,   0,   0,
  54, -78, 162,  -90, -24,   30,  60, -60,  60, -60,
  -54,  78,  78,   90, 144,   90, -60, -60, -60, -60,
  9,  -8, -18,  -30, -24,    0,  20,  60,   0,   0,
  -9,  18, -32,    0,  24,   30,   0,   0, -60,  20,
  9, -18,  -8,    0, -24,  -30,   0,   0,  60,  20
];

const c0n_ = 372;

// prettier-ignore
const c3n_ = [
  0, 0, -131, 0,  138,  144, 0,   0, -102, -31,
  0, 0,    7, 0, -138,   42, 0,   0,  102, -31,
  62, 0,  -31, 0,    0,  -62, 0,   0,    0,  31,
  124, 0,  -62, 0,    0, -124, 0,   0,    0,  62,
  124, 0,  -62, 0,    0, -124, 0,   0,    0,  62,
  62, 0,  -31, 0,    0,  -62, 0,   0,    0,  31,
  0, 0,   45, 0, -183,   -9, 0,  93,   18,   0,
  0, 0,  216, 0,   33,   87, 0, -93,   12, -93,
  0, 0,  156, 0,  153,   99, 0, -93,  -12, -93,
  0, 0,  -45, 0,   -3,    9, 0,  93,  -18,   0,
  0, 0,  -55, 0,   48,   42, 0,   0,  -84,  31,
  0, 0,   -7, 0,  -48,  -42, 0,   0,   84,  31,
];

const c0s_ = 372;

// prettier-ignore
const c3s_ = [
  18,  -36, -122,   0,  120,  135, 0,   0,  -84, -31,
  -18,   36,   -2,   0, -120,   51, 0,   0,   84, -31,
  36, -165,  -27,  93,  147,   -9, 0, -93,   18,   0,
  210,   45, -111, -93,  -57, -192, 0,  93,   12,  93,
  162,  141,  -75, -93, -129, -180, 0,  93,  -12,  93,
  -36,  -21,   27,  93,   39,    9, 0, -93,  -18,   0,
  0,    0,   62,   0,    0,   31, 0,   0,    0, -31,
  0,    0,  124,   0,    0,   62, 0,   0,    0, -62,
  0,    0,  124,   0,    0,   62, 0,   0,    0, -62,
  0,    0,   62,   0,    0,   31, 0,   0,    0, -31,
  -18,   36,  -64,   0,   66,   51, 0,   0, -102,  31,
  18,  -36,    2,   0,  -66,  -51, 0,   0,  102,  31,
];
const stencilsize_ = 12;
const nterms_ = ((3 + 1) * (3 + 2)) / 2; // for a cubic fit
const PIXEL_SIZE = 2;

export class GeoidHeightModel {
  constructor(options) {
    this.options = options;
    this._v00 = 0;
    this._v01 = 0;
    this._v10 = 0;
    this._v11 = 0;
    this._t = [];

    this._ix = this.options._width;
    this._iy = this.options._height;
  }

  // eslint-disable-next-line max-statements, complexity
  getHeight(lat, lon) {
    // C++: Math::LatFix(lat)
    lat = Math.abs(lat) > 90 ? NaN : lat;

    if (isNaN(lat) || isNaN(lon)) {
      return NaN;
    }

    // C++: Math::AngNormalize(lon)
    const rem = _remainder(lon, 360);
    lon = rem !== -180 ? rem : 180;

    let fx = lon * this.options._rlonres;
    let fy = -lat * this.options._rlatres;
    let ix = Math.floor(fx);
    let iy = Math.min(Math.round((this.options._height - 1) / 2 - 1), Math.floor(fy));
    fx -= ix;
    fy -= iy;
    iy += (this.options._height - 1) / 2;
    ix += ix < 0 ? this.options._width : ix >= this.options._width ? -this.options._width : 0;
    let v00 = 0;
    let v01 = 0;
    let v10 = 0;
    let v11 = 0;
    let t = new Array(nterms_);
    if (!(ix === this._ix && iy === this._iy)) {
      if (!this.options.cubic) {
        v00 = this._rawval(ix, iy);
        v01 = this._rawval(ix + 1, iy);
        v10 = this._rawval(ix, iy + 1);
        v11 = this._rawval(ix + 1, iy + 1);
      } else {
        const v = [
          this._rawval(ix, iy - 1),
          this._rawval(ix + 1, iy - 1),
          this._rawval(ix - 1, iy),
          this._rawval(ix, iy),
          this._rawval(ix + 1, iy),
          this._rawval(ix + 2, iy),
          this._rawval(ix - 1, iy + 1),
          this._rawval(ix, iy + 1),
          this._rawval(ix + 1, iy + 1),
          this._rawval(ix + 2, iy + 1),
          this._rawval(ix, iy + 2),
          this._rawval(ix + 1, iy + 2)
        ];

        let c3x = c3n_;
        if (iy !== 0) {
          c3x = iy === this.options._height - 2 ? c3s_ : c3_;
        }
        let c0x = c0n_;
        if (iy !== 0) {
          c0x = iy === this.options._height - 2 ? c0s_ : c0_;
        }
        for (let i = 0; i < nterms_; ++i) {
          t[i] = 0;
          // eslint-disable-next-line max-depth
          for (let j = 0; j < stencilsize_; ++j) {
            t[i] += v[j] * c3x[nterms_ * j + i];
          }
          t[i] /= c0x;
        }
      }
    } else if (!this.options.cubic) {
      // same cell; used cached coefficients
      v00 = this._v00;
      v01 = this._v01;
      v10 = this._v10;
      v11 = this._v11;
    } else {
      t = this._t;
    }

    if (!this.options.cubic) {
      const a = (1 - fx) * v00 + fx * v01;
      const b = (1 - fx) * v10 + fx * v11;
      const c = (1 - fy) * a + fy * b;
      const h = this.options._offset + this.options._scale * c;
      this._ix = ix;
      this._iy = iy;
      this._v00 = v00;
      this._v01 = v01;
      this._v10 = v10;
      this._v11 = v11;
      return h;
    }
    let h =
      t[0] +
      fx * (t[1] + fx * (t[3] + fx * t[6])) +
      fy * (t[2] + fx * (t[4] + fx * t[7]) + fy * (t[5] + fx * t[8] + fy * t[9]));
    h = this.options._offset + this.options._scale * h;
    this._ix = ix;
    this._iy = iy;
    this._t = t;
    return h;
  }

  /**
   * Method seeks for particular data in th pgm buffer
   * Code is ported from corresponding method
   * in /GeographicLib-1.50.1/include/GeographicLib/Geoid.hpp
   * @param {number} ix - longituge parameter
   * @param {number} iy - latitude parameter
   * @returns {number} data from pgm binary buffer
   */
  _rawval(ix, iy) {
    if (ix < 0) {
      ix += this.options._width;
    } else if (ix >= this.options._width) {
      ix -= this.options._width;
    }
    if (iy < 0 || iy >= this.options._height) {
      iy = iy < 0 ? -iy : 2 * (this.options._height - 1) - iy;
      ix += ((ix < this.options._width / 2 ? 1 : -1) * this.options._width) / 2;
    }
    const bufferPosition = this.options._datastart + PIXEL_SIZE * (iy * this.options._swidth + ix);
    // initial values to suppress warnings in case get fails
    const a = this.options.data[bufferPosition];
    const b = this.options.data[bufferPosition + 1];
    const r = (a << 8) | b;
    return r;
  }
}

/**
 * Method calculates remainder of float numbers division
 * Code is ported from corresponding method
 * in /GeographicLib-1.50.1/src/Math.cpp
 * Math::remainder(T x, T y)
 * @param {number} x - numerator
 * @param {number} y - denominator
 * @returns {number} - remainder
 */
function _remainder(x, y) {
  y = Math.abs(y); // The result doesn't depend on the sign of y
  let z = _fmod(x, y);
  if (2 * Math.abs(z) === y) z -= _fmod(x, 2 * y) - z;
  // Implement ties to even
  else if (2 * Math.abs(z) > y) z += z < 0 ? y : -y; // Fold remaining cases to (-y/2, y/2)
  return z;
}

/**
 * Computes the floating-point remainder of the division operation x/y
 * @param {number} x - numerator
 * @param {number} y - denominator
 * @returns {number} - remainder
 */
function _fmod(x, y) {
  return x - Math.floor(x / y) * y;
}
