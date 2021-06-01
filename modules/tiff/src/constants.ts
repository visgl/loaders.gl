import GL from '@luma.gl/constants';
import type { TypedArray } from 'zarr';

export const MAX_COLOR_INTENSITY = 255;

export const DEFAULT_COLOR_OFF = [0, 0, 0];

export const MAX_SLIDERS_AND_CHANNELS = 6;

export const DEFAULT_FONT_FAMILY =
  "-apple-system, 'Helvetica Neue', Arial, sans-serif";

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

export const COLORMAPS = [
  'jet',
  'hsv',
  'hot',
  'cool',
  'spring',
  'summer',
  'autumn',
  'winter',
  'bone',
  'copper',
  'greys',
  'yignbu',
  'greens',
  'yiorrd',
  'bluered',
  'rdbu',
  'picnic',
  'rainbow',
  'portland',
  'blackbody',
  'earth',
  'electric',
  'alpha',
  'viridis',
  'inferno',
  'magma',
  'plasma',
  'warm',
  'rainbow-soft',
  'bathymetry',
  'cdom',
  'chlorophyll',
  'density',
  'freesurface-blue',
  'freesurface-red',
  'oxygen',
  'par',
  'phase',
  'salinity',
  'temperature',
  'turbidity',
  'velocity-blue',
  'velocity-green',
  'cubehelix'
] as const;

export enum RENDERING_MODES {
  MAX_INTENSITY_PROJECTION = 'Maximum Intensity Projection',
  MIN_INTENSITY_PROJECTION = 'Minimum Intensity Projection',
  ADDITIVE = 'Additive'
}

export const GLOBAL_SLIDER_DIMENSION_FIELDS = ['z', 't'] as const;

export enum INTERPOLATION_MODES {
  LINEAR = GL.LINEAR,
  NEAREST = GL.NEAREST
}
