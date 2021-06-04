/** Any typed array */
export type TypedArray =
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Uint8ClampedArray
  | Float32Array
  | Float64Array;

export type BigTypedArray = TypedArray | BigInt64Array | BigUint64Array;

/** Any numeric array: typed array or `number[]` */
export type NumberArray = number[] | TypedArray;

/** Any array: typed array or js array (`any[]`) */
export type AnyArray = any[] | TypedArray;
