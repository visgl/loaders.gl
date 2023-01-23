// loaders.gl, MIT license

import type {TypedArray} from '../../../types';
import {DataType} from '../../common-types';

export function getArrowType(array: TypedArray): DataType {
  switch (array.constructor) {
    case Int8Array:
      return 'int8';
    case Uint8Array:
    case Uint8ClampedArray:
      return 'uint8';
    case Int16Array:
      return 'int16';
    case Uint16Array:
      return 'uint16';
    case Int32Array:
      return 'int32';
    case Uint32Array:
      return 'uint32';
    case Float32Array:
      return 'float32';
    case Float64Array:
      return 'float64';
    default:
      throw new Error('array type not supported');
  }
}
