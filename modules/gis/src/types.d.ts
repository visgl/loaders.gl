export type BinaryAttribute = {value: any[], size: number}

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
