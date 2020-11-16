import {GeoidHeightModel} from './geoid-height-model';

// eslint-disable-next-line
export function parsePgm(data) {
  if (
    !(data[0] === 80 && data[1] === 53 && ((data[2] === 13 && data[3] === 10) || data[2] === 10))
  ) {
    throw new Error('Geoid model file: no PGM header');
  }
  let i = data[2] === 13 ? 4 : 3;
  let offset = null;
  let scale = null;
  function getline() {
    const start = i;
    let j;
    for (j = i; ; j++) {
      if (j >= data.length) {
        throw new Error('Geoid model file: missing newline in header');
      }
      if (data[j] === 10) {
        i = j + 1;
        break;
      }
    }
    if (j > start && data[j - 1] === 13) j--;
    return String.fromCharCode.apply(null, data.slice(start, j));
  }
  let m;
  let s;
  for (;;) {
    s = getline();
    if (s[0] !== '#') break;
    m = s.match(/^# Offset (.*)$/);
    if (m) {
      offset = parseInt(m[1], 10);
      if (!isFinite(offset)) {
        throw new Error(`Geoid model file: bad offset ${m[1]}`);
      }
    } else {
      m = s.match(/^# Scale (.*)$/);
      if (m) {
        scale = parseFloat(m[1]);
        // eslint-disable-next-line
        if (!isFinite(scale)) {
          throw new Error(`Geoid model file: bad scale ${m[1]}`);
        }
      }
    }
  }
  m = s.match(/^\s*(\d+)\s+(\d+)\s*$/);
  let width = null;
  let height = null;
  if (m) {
    width = parseInt(m[1], 10);
    height = parseInt(m[2], 10);
  }
  if (!(m && (width !== null && width >= 0) && (height !== null && height >= 0))) {
    throw new Error('Geoid model file: bad PGM width&height line');
  } else {
    const levels = parseInt(getline(), 10);
    if (levels !== 65535) {
      throw new Error('Geoid model file: PGM file must have 65535 gray levels');
    }
    if (offset === null) {
      throw new Error('Geoid model file: PGM file does not contain offset');
    }
    if (scale === null) {
      throw new Error('Geoid model file: PGM file does not contain scale');
    }
    if (width < 2 || height < 2) {
      throw new Error('Geoid model file: Raster size too small');
    }

    const payloadLen = data.length - i;
    if (payloadLen !== width * height * 2) {
      throw new Error('Geoid model file: File has the wrong length');
    }

    return new GeoidHeightModel({
      scale,
      offset,
      width,
      height,
      rlonres: width / 360,
      rlatres: (height - 1) / 180,
      data,
      rawval: (ix, iy) => {
        if (iy < 0) {
          iy = -iy;
          ix += width / 2;
        } else if (iy >= height) {
          iy = 2 * (height - 1) - iy;
          ix += width / 2;
        }
        if (ix < 0) {
          ix += width;
        } else if (ix >= width) {
          ix -= width;
        }
        const k = (iy * width + ix) * 2 + i;
        return (data[k] << 8) | data[k + 1];
      }
    });
  }
}
