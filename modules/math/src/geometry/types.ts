/**
 * Type for Bounding Box computing
 */
export type Geometry = {
  min: number[];
  max: number[];
};

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
