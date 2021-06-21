type TypedIntArray =
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Int32Array
  | Uint32Array;

type TypedFloatArray = Float32Array | Float64Array;

type TypedArray = TypedIntArray | TypedFloatArray;

export type AnyArrayType = Array<any> | TypedArray;

export enum VECTOR_TYPES {
  FLOAT,
  DATE
}
