import type {TypedArray} from '../../types';
import {
  DataType,
  Float32,
  Float64,
  Int16,
  Int32,
  Int8,
  Uint16,
  Uint32,
  Uint8,
  Int8Vector,
  Uint8Vector,
  Int16Vector,
  Uint16Vector,
  Int32Vector,
  Uint32Vector,
  Float32Vector,
  Float64Vector
} from 'apache-arrow/Arrow.dom';
import {AbstractVector} from 'apache-arrow/vector';

export function getArrowType(array: TypedArray): DataType {
  switch (array.constructor) {
    case Int8Array:
      return new Int8();
    case Uint8Array:
      return new Uint8();
    case Int16Array:
      return new Int16();
    case Uint16Array:
      return new Uint16();
    case Int32Array:
      return new Int32();
    case Uint32Array:
      return new Uint32();
    case Float32Array:
      return new Float32();
    case Float64Array:
      return new Float64();
    default:
      throw new Error('array type not supported');
  }
}

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
