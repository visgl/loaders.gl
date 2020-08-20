type TypedArray =
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Uint8ClampedArray
  | Float32Array
  | Float64Array;

export type BinaryAttribute = {value: TypedArray; size: number};

export type BinaryGeometryData = {
  points?: {
    positions: BinaryAttribute;
    featureIds: BinaryAttribute;
    globalFeatureIds: BinaryAttribute;
  };
  lines?: {
    positions: BinaryAttribute;
    pathIndices: BinaryAttribute;
    featureIds: BinaryAttribute;
    globalFeatureIds: BinaryAttribute;
  };
  polygons?: {
    positions: BinaryAttribute;
    polygonIndices: BinaryAttribute;
    primitivePolygonIndices: BinaryAttribute;
    featureIds: BinaryAttribute;
    globalFeatureIds: BinaryAttribute;
  };
};
