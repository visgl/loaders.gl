/**
 * Type for encoding to Vector4
 */
export type Vector4 = {
  x: number;
  y: number;
  z: number;
  w: number;
};

// Typed arrays
export type TypedIntArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Int32Array
  | Uint32Array;

export type TypedFloatArray = Uint16Array | Float32Array | Float64Array;

export type TypedArray = TypedIntArray | TypedFloatArray;
