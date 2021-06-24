/**
 * Type for Bounding Box computing
 */
export type Geometry = {
  min: number[];
  max: number[];
};
/**
 * Different methods of working with geometries depending on glType
 * @param mode
 */
export declare function getPrimitiveModeType(mode: number): number;
export declare function isPrimitiveModeExpandable(mode: number): boolean;
export declare function getPrimitiveModeExpandedLength(mode: number, length: number): number;
/**
 * Iteration info for making primitive iterator
 */
export type Information = {
  attributes: object;
  type: number | void;
  i1: number;
  i2: number;
  i3: number;
  primitiveIndex?: object;
};
/**
 * Type for encoding to Vector4
 */
export type Vector4 = {
  x: number;
  y: number;
  z: number;
  w: number;
};
/**
 * For computing geometries
 */
export type GeometryOptions = {
  attributes: {positions: {[index: string]: number}; POSITION: number};
  values: GeometryOptions & ArrayBufferView;
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
