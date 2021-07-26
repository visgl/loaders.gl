export type WktParsedPoint = {
  positions: WktPositions;
  offset: number | undefined;
  type?: string;
};

export type WKTParsedLineString = {
  positions: WktPositions;
  pathIndices: WktIndices;
  offset: number | undefined;
  type?: string;
};

export type WktPositions = {
  value: Float64Array;
  size: number;
};

export type WktIndices = {
  value: Uint16Array;
  size: number;
};

export type WktParsedPolygon = {
  positions: WktPositions;
  polygonIndices: WktIndices;
  primitivePolygonIndices: WktIndices;
  offset: number | undefined;
  type?: string;
};

export type WktParsedMultiPoint = {
  positions: WktPositions;
  type?: string;
};

export type WktParsedMultiLineString = {
  positions: WktPositions;
  pathIndices: WktIndices;
  type?: string;
};

export type WktParsedMultiPolygon = {
  positions: WktPositions;
  polygonIndices: WktIndices;
  primitivePolygonIndices: WktIndices;
  type?: string;
};
