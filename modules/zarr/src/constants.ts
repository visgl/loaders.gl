import GL from '@luma.gl/constants';
import type {TypedArray} from 'zarr';

/**
 * @deprecated We plan to remove `DTYPE_VALUES` as a part of Viv's public API as it
 * leaks internal implementation details. If this is something your project relies
 * on, please open an issue for further discussion.
 *
 * More info can be found here: https://github.com/hms-dbmi/viv/pull/372#discussion_r571707517
 */
export const DTYPE_VALUES = {
  Uint8: {
    format: GL.R8UI,
    dataFormat: GL.RED_INTEGER,
    type: GL.UNSIGNED_BYTE,
    max: 2 ** 8 - 1,
    sampler: 'usampler2D'
  },
  Uint16: {
    format: GL.R16UI,
    dataFormat: GL.RED_INTEGER,
    type: GL.UNSIGNED_SHORT,
    max: 2 ** 16 - 1,
    sampler: 'usampler2D'
  },
  Uint32: {
    format: GL.R32UI,
    dataFormat: GL.RED_INTEGER,
    type: GL.UNSIGNED_INT,
    max: 2 ** 32 - 1,
    sampler: 'usampler2D'
  },
  Float32: {
    format: GL.R32F,
    dataFormat: GL.RED,
    type: GL.FLOAT,
    // Not sure what to do about this one - a good use case for channel stats, I suppose:
    // https://en.wikipedia.org/wiki/Single-precision_floating-point_format.
    max: 3.4 * 10 ** 38,
    sampler: 'sampler2D'
  },
  Int8: {
    format: GL.R8I,
    dataFormat: GL.RED_INTEGER,
    type: GL.BYTE,
    max: 2 ** (8 - 1) - 1,
    sampler: 'isampler2D'
  },
  Int16: {
    format: GL.R16I,
    dataFormat: GL.RED_INTEGER,
    type: GL.SHORT,
    max: 2 ** (16 - 1) - 1,
    sampler: 'isampler2D'
  },
  Int32: {
    format: GL.R32I,
    dataFormat: GL.RED_INTEGER,
    type: GL.INT,
    max: 2 ** (32 - 1) - 1,
    sampler: 'isampler2D'
  },
  // Cast Float64 as 32 bit float point so it can be rendered.
  Float64: {
    format: GL.R32F,
    dataFormat: GL.RED,
    type: GL.FLOAT,
    // Not sure what to do about this one - a good use case for channel stats, I suppose:
    // https://en.wikipedia.org/wiki/Single-precision_floating-point_format.
    max: 3.4 * 10 ** 38,
    sampler: 'sampler2D',
    cast: (data: TypedArray) => new Float32Array(data)
  }
} as const;
