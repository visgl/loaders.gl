// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import type {TypedArray} from '@loaders.gl/schema';
import * as arrow from 'apache-arrow';

/** Return an Apache Arrow Type instance that corresponds to the type of the elements in the supplied Typed Array */
export function getArrowType(array: TypedArray): arrow.DataType {
  switch (array.constructor) {
    case Int8Array:
      return new arrow.Int8();
    case Uint8Array:
      return new arrow.Uint8();
    case Int16Array:
      return new arrow.Int16();
    case Uint16Array:
      return new arrow.Uint16();
    case Int32Array:
      return new arrow.Int32();
    case Uint32Array:
      return new arrow.Uint32();
    case Float32Array:
      return new arrow.Float32();
    case Float64Array:
      return new arrow.Float64();
    default:
      throw new Error('array type not supported');
  }
}

/*
export function getArrowVector(array: TypedArray): AbstractVector {
  switch (array.constructor) {
    case Int8Array:
      return Int8Vector.from(array);
    case Uint8Array:
      return Uint8Vector.from(array);
    case Int16Array:
      return Int16Vector.from(array);
    case Uint16Array:
      return Uint16Vector.from(array);
    case Int32Array:
      return Int32Vector.from(array);
    case Uint32Array:
      return Uint32Vector.from(array);
    case Float32Array:
      return Float32Vector.from(array);
    case Float64Array:
      return Float64Vector.from(array);
    default:
      throw new Error('array type not supported');
  }
}
*/
