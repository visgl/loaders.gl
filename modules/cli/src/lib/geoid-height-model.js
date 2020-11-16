const c0 = 240;
const c3 = [
  [9, -18, -88, 0, 96, 90, 0, 0, -60, -20],
  [-9, 18, 8, 0, -96, 30, 0, 0, 60, -20],
  [9, -88, -18, 90, 96, 0, -20, -60, 0, 0],
  [186, -42, -42, -150, -96, -150, 60, 60, 60, 60],
  [54, 162, -78, 30, -24, -90, -60, 60, -60, 60],
  [-9, -32, 18, 30, 24, 0, 20, -60, 0, 0],
  [-9, 8, 18, 30, -96, 0, -20, 60, 0, 0],
  [54, -78, 162, -90, -24, 30, 60, -60, 60, -60],
  [-54, 78, 78, 90, 144, 90, -60, -60, -60, -60],
  [9, -8, -18, -30, -24, 0, 20, 60, 0, 0],
  [-9, 18, -32, 0, 24, 30, 0, 0, -60, 20],
  [9, -18, -8, 0, -24, -30, 0, 0, 60, 20]
];

const c0n = 372;
const c3n = [
  [0, 0, -131, 0, 138, 144, 0, 0, -102, -31],
  [0, 0, 7, 0, -138, 42, 0, 0, 102, -31],
  [62, 0, -31, 0, 0, -62, 0, 0, 0, 31],
  [124, 0, -62, 0, 0, -124, 0, 0, 0, 62],
  [124, 0, -62, 0, 0, -124, 0, 0, 0, 62],
  [62, 0, -31, 0, 0, -62, 0, 0, 0, 31],
  [0, 0, 45, 0, -183, -9, 0, 93, 18, 0],
  [0, 0, 216, 0, 33, 87, 0, -93, 12, -93],
  [0, 0, 156, 0, 153, 99, 0, -93, -12, -93],
  [0, 0, -45, 0, -3, 9, 0, 93, -18, 0],
  [0, 0, -55, 0, 48, 42, 0, 0, -84, 31],
  [0, 0, -7, 0, -48, -42, 0, 0, 84, 31]
];

const c0s = 372;
const c3s = [
  [18, -36, -122, 0, 120, 135, 0, 0, -84, -31],
  [-18, 36, -2, 0, -120, 51, 0, 0, 84, -31],
  [36, -165, -27, 93, 147, -9, 0, -93, 18, 0],
  [210, 45, -111, -93, -57, -192, 0, 93, 12, 93],
  [162, 141, -75, -93, -129, -180, 0, 93, -12, 93],
  [-36, -21, 27, 93, 39, 9, 0, -93, -18, 0],
  [0, 0, 62, 0, 0, 31, 0, 0, 0, -31],
  [0, 0, 124, 0, 0, 62, 0, 0, 0, -62],
  [0, 0, 124, 0, 0, 62, 0, 0, 0, -62],
  [0, 0, 62, 0, 0, 31, 0, 0, 0, -31],
  [-18, 36, -64, 0, 66, 51, 0, 0, -102, 31],
  [18, -36, 2, 0, -66, -51, 0, 0, 102, 31]
];

export class GeoidHeightModel {
  constructor(options) {
    this.options = options;
    this.cachedIx = null;
    this.cachedIy = null;
    this.v00 = 0;
    this.v01 = 0;
    this.v10 = 0;
    this.v11 = 0;
    this.t = [];
  }

  // eslint-disable-next-line
  getHeight(lat, lon, cubic) {
    if (lon < 0) lon += 360;
    let fy = (90 - lat) * this.options.rlatres;
    let fx = lon * this.options.rlonres;
    let iy = Math.floor(fy);
    const ix = Math.floor(fx);
    fx -= ix;
    fy -= iy;
    if (iy === this.options.height - 1) {
      iy--;
    }

    if (this.cachedIx !== ix || this.cachedIy !== iy) {
      this.cachedIx = ix;
      this.cachedIy = iy;
      if (cubic) {
        let c3x = c3;
        let c0x = c0;
        if (iy === 0) {
          c3x = c3n;
          c0x = c0n;
        } else if (iy === this.options.height - 2) {
          c3x = c3s;
          c0x = c0s;
        }
        const v = [
          this.options.rawval(ix, iy - 1),
          this.options.rawval(ix + 1, iy - 1),
          this.options.rawval(ix - 1, iy),
          this.options.rawval(ix, iy),
          this.options.rawval(ix + 1, iy),
          this.options.rawval(ix + 2, iy),
          this.options.rawval(ix - 1, iy + 1),
          this.options.rawval(ix, iy + 1),
          this.options.rawval(ix + 1, iy + 1),
          this.options.rawval(ix + 2, iy + 1),
          this.options.rawval(ix, iy + 2),
          this.options.rawval(ix + 1, iy + 2)
        ];
        this.t = Array(10).map(function(_, i, arr) {
          return (
            v.reduce(function(acc, vj, j) {
              return acc + vj * c3x[j][i];
            }) / c0x
          );
        });
      } else {
        this.v00 = this.options.rawval(ix, iy);
        this.v01 = this.options.rawval(ix + 1, iy);
        this.v10 = this.options.rawval(ix, iy + 1);
        this.v11 = this.options.rawval(ix + 1, iy + 1);
      }
    }

    let h = null;
    if (cubic) {
      const t = this.t;
      h =
        t[0] +
        fx * (t[1] + fx * (t[3] + fx * t[6])) +
        fy * (t[2] + fx * (t[4] + fx * t[7]) + fy * (t[5] + fx * t[8] + fy * t[9]));
    } else {
      const a = (1 - fx) * this.v00 + fx * this.v01;
      const b = (1 - fx) * this.v10 + fx * this.v11;
      h = (1 - fy) * a + fy * b;
    }

    return this.options.offset + this.options.scale * h;
  }
}
