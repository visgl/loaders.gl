import {
  DataType,
  TypedArray,
  Float32,
  Float64,
  Int16,
  Int32,
  Int8,
  Uint16,
  Uint32,
  Uint8
} from '../schema/classes/type';

export function getArrowTypeFromTypedArray(array: TypedArray): DataType {
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
