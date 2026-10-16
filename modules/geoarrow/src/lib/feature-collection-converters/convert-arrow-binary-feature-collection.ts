// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {
  ArrowBinaryFeatureCollection,
  ArrowBinaryLineFeature,
  ArrowBinaryPointFeature,
  ArrowBinaryPolygonFeature,
  BinaryAttribute,
  BinaryFeatureCollection,
  BinaryLineFeature,
  BinaryPointFeature,
  BinaryPolygonFeature,
  TypedArray
} from '@loaders.gl/schema';

type SupportedNumericArray =
  | Float64Array
  | Float32Array
  | Int32Array
  | Uint32Array
  | Int16Array
  | Uint16Array
  | Int8Array
  | Uint8Array;

/**
 * Converts a binary feature collection into Arrow-backed family tables.
 *
 * The wrapper preserves the existing family split while exposing geometry and numeric
 * columns as Arrow nested list vectors backed by the same flat typed arrays where the
 * offset semantics already match.
 *
 * @param binaryFeatures Binary features to wrap.
 * @returns Arrow-backed wrapper around the binary feature collection.
 */
export function convertBinaryFeatureCollectionToArrowBinaryFeatureCollection(
  binaryFeatures: BinaryFeatureCollection
): ArrowBinaryFeatureCollection {
  return {
    shape: 'arrow-binary-feature-collection',
    points: binaryFeatures.points ? convertPointsToArrowTable(binaryFeatures.points) : undefined,
    lines: binaryFeatures.lines ? convertLinesToArrowTable(binaryFeatures.lines) : undefined,
    polygons: binaryFeatures.polygons
      ? convertPolygonsToArrowTable(binaryFeatures.polygons)
      : undefined
  };
}

/**
 * Converts an Arrow-backed binary feature wrapper back into the standard binary feature
 * collection shape.
 *
 * @param arrowBinaryFeatures Arrow-backed wrapper to unwrap.
 * @returns Standard binary feature collection.
 */
export function convertArrowBinaryFeatureCollectionToBinaryFeatureCollection(
  arrowBinaryFeatures: ArrowBinaryFeatureCollection
): BinaryFeatureCollection {
  return {
    shape: 'binary-feature-collection',
    points: arrowBinaryFeatures.points
      ? convertArrowPointTableToBinary(arrowBinaryFeatures.points)
      : undefined,
    lines: arrowBinaryFeatures.lines
      ? convertArrowLineTableToBinary(arrowBinaryFeatures.lines)
      : undefined,
    polygons: arrowBinaryFeatures.polygons
      ? convertArrowPolygonTableToBinary(arrowBinaryFeatures.polygons)
      : undefined
  };
}

/** Converts binary point features into an Arrow table wrapper. */
function convertPointsToArrowTable(binaryPoints: BinaryPointFeature): ArrowBinaryPointFeature {
  const pointOffsets = derivePointOffsets(binaryPoints.featureIds.value as Uint32Array);
  const columns: Record<string, arrow.Data> = {
    geometry: makeListData(
      makeCoordinateData(binaryPoints.positions.value, binaryPoints.positions.size),
      pointOffsets,
      'value'
    ),
    featureIds: makeListData(
      makePrimitiveData(binaryPoints.featureIds.value),
      pointOffsets,
      'value'
    ),
    globalFeatureIds: makeListData(
      makePrimitiveData(binaryPoints.globalFeatureIds.value),
      pointOffsets,
      'value'
    )
  };

  for (const [propertyName, numericProp] of Object.entries(binaryPoints.numericProps) as Array<
    [string, BinaryAttribute]
  >) {
    columns[propertyName] = makeListData(
      makePrimitiveData(numericProp.value),
      pointOffsets,
      'value'
    );
  }

  return {
    type: 'Point',
    table: new arrow.Table(new arrow.RecordBatch(columns)),
    properties: binaryPoints.properties,
    fields: binaryPoints.fields
  };
}

/** Converts binary line features into an Arrow table wrapper. */
function convertLinesToArrowTable(binaryLines: BinaryLineFeature): ArrowBinaryLineFeature {
  const pathOffsets = reinterpretUint32AsInt32(binaryLines.pathIndices.value as Uint32Array);
  const columns: Record<string, arrow.Data> = {
    geometry: makeListData(
      makeCoordinateData(binaryLines.positions.value, binaryLines.positions.size),
      pathOffsets,
      'value'
    ),
    featureIds: makeListData(makePrimitiveData(binaryLines.featureIds.value), pathOffsets, 'value'),
    globalFeatureIds: makeListData(
      makePrimitiveData(binaryLines.globalFeatureIds.value),
      pathOffsets,
      'value'
    )
  };

  for (const [propertyName, numericProp] of Object.entries(binaryLines.numericProps) as Array<
    [string, BinaryAttribute]
  >) {
    columns[propertyName] = makeListData(
      makePrimitiveData(numericProp.value),
      pathOffsets,
      'value'
    );
  }

  return {
    type: 'LineString',
    table: new arrow.Table(new arrow.RecordBatch(columns)),
    properties: binaryLines.properties,
    fields: binaryLines.fields
  };
}

/** Converts binary polygon features into an Arrow table wrapper. */
function convertPolygonsToArrowTable(
  binaryPolygons: BinaryPolygonFeature
): ArrowBinaryPolygonFeature {
  const polygonRingOffsets = derivePolygonRingOffsets(
    binaryPolygons.polygonIndices.value as Uint32Array,
    binaryPolygons.primitivePolygonIndices.value as Uint32Array
  );
  const primitivePolygonOffsets = reinterpretUint32AsInt32(
    binaryPolygons.primitivePolygonIndices.value as Uint32Array
  );
  const columns: Record<string, arrow.Data> = {
    geometry: makeNestedListData(
      makeCoordinateData(binaryPolygons.positions.value, binaryPolygons.positions.size),
      primitivePolygonOffsets,
      polygonRingOffsets,
      'value'
    ),
    polygonIndices: makeListData(
      makePrimitiveData(binaryPolygons.polygonIndices.value),
      Int32Array.from([0, binaryPolygons.polygonIndices.value.length]),
      'value'
    ),
    featureIds: makeNestedListData(
      makePrimitiveData(binaryPolygons.featureIds.value),
      primitivePolygonOffsets,
      polygonRingOffsets,
      'value'
    ),
    globalFeatureIds: makeNestedListData(
      makePrimitiveData(binaryPolygons.globalFeatureIds.value),
      primitivePolygonOffsets,
      polygonRingOffsets,
      'value'
    )
  };

  for (const [propertyName, numericProp] of Object.entries(binaryPolygons.numericProps) as Array<
    [string, BinaryAttribute]
  >) {
    columns[propertyName] = makeNestedListData(
      makePrimitiveData(numericProp.value),
      primitivePolygonOffsets,
      polygonRingOffsets,
      'value'
    );
  }

  if (binaryPolygons.triangles) {
    columns.triangles = makeListData(
      makePrimitiveData(binaryPolygons.triangles.value),
      derivePolygonTriangleOffsets(
        binaryPolygons.polygonIndices.value as Uint32Array,
        binaryPolygons.triangles.value as Uint32Array
      ),
      'value'
    );
  }

  return {
    type: 'Polygon',
    table: new arrow.Table(new arrow.RecordBatch(columns)),
    properties: binaryPolygons.properties,
    fields: binaryPolygons.fields
  };
}

/** Converts an Arrow-backed point table wrapper into binary point features. */
function convertArrowPointTableToBinary(arrowPoints: ArrowBinaryPointFeature): BinaryPointFeature {
  const geometryData = getRequiredColumnData(arrowPoints.table, 'geometry');
  const featureIdsData = getRequiredColumnData(arrowPoints.table, 'featureIds');
  const globalFeatureIdsData = getRequiredColumnData(arrowPoints.table, 'globalFeatureIds');

  return {
    type: 'Point',
    positions: {
      value: getCoordinateValuesFromListData(geometryData),
      size: getCoordinateSizeFromListData(geometryData)
    },
    featureIds: {
      value: getPrimitiveChildValues(featureIdsData) as Uint32Array,
      size: 1
    },
    globalFeatureIds: {
      value: getPrimitiveChildValues(globalFeatureIdsData) as Uint32Array,
      size: 1
    },
    numericProps: getArrowNumericProps(arrowPoints.table, [
      'geometry',
      'featureIds',
      'globalFeatureIds'
    ]),
    properties: arrowPoints.properties,
    fields: arrowPoints.fields
  };
}

/** Converts an Arrow-backed line table wrapper into binary line features. */
function convertArrowLineTableToBinary(arrowLines: ArrowBinaryLineFeature): BinaryLineFeature {
  const geometryData = getRequiredColumnData(arrowLines.table, 'geometry');
  const featureIdsData = getRequiredColumnData(arrowLines.table, 'featureIds');
  const globalFeatureIdsData = getRequiredColumnData(arrowLines.table, 'globalFeatureIds');

  return {
    type: 'LineString',
    positions: {
      value: getCoordinateValuesFromListData(geometryData),
      size: getCoordinateSizeFromListData(geometryData)
    },
    pathIndices: {
      value: reinterpretInt32AsUint32(geometryData.valueOffsets),
      size: 1
    },
    featureIds: {
      value: getPrimitiveChildValues(featureIdsData) as Uint32Array,
      size: 1
    },
    globalFeatureIds: {
      value: getPrimitiveChildValues(globalFeatureIdsData) as Uint32Array,
      size: 1
    },
    numericProps: getArrowNumericProps(arrowLines.table, [
      'geometry',
      'featureIds',
      'globalFeatureIds'
    ]),
    properties: arrowLines.properties,
    fields: arrowLines.fields
  };
}

/** Converts an Arrow-backed polygon table wrapper into binary polygon features. */
function convertArrowPolygonTableToBinary(
  arrowPolygons: ArrowBinaryPolygonFeature
): BinaryPolygonFeature {
  const geometryData = getRequiredColumnData(arrowPolygons.table, 'geometry');
  const ringData = geometryData.children[0];
  const polygonIndicesData = getOptionalColumnData(arrowPolygons.table, 'polygonIndices');
  const featureIdsData = getRequiredColumnData(arrowPolygons.table, 'featureIds');
  const globalFeatureIdsData = getRequiredColumnData(arrowPolygons.table, 'globalFeatureIds');
  const polygonRingOffsets = geometryData.valueOffsets;
  const primitivePolygonIndices = reinterpretInt32AsUint32(ringData.valueOffsets);
  const polygonIndices = polygonIndicesData
    ? (getPrimitiveChildValues(polygonIndicesData) as Uint32Array)
    : derivePolygonIndicesFromRingOffsets(polygonRingOffsets, primitivePolygonIndices);
  const trianglesData = getOptionalColumnData(arrowPolygons.table, 'triangles');

  return {
    type: 'Polygon',
    positions: {
      value: getCoordinateValuesFromNestedListData(geometryData),
      size: getCoordinateSizeFromNestedListData(geometryData)
    },
    polygonIndices: {
      value: polygonIndices,
      size: 1
    },
    primitivePolygonIndices: {
      value: primitivePolygonIndices,
      size: 1
    },
    triangles: trianglesData
      ? {
          value: getPrimitiveChildValues(trianglesData) as Uint32Array,
          size: 1
        }
      : undefined,
    featureIds: {
      value: getPrimitiveChildValuesFromNestedListData(featureIdsData) as Uint32Array,
      size: 1
    },
    globalFeatureIds: {
      value: getPrimitiveChildValuesFromNestedListData(globalFeatureIdsData) as Uint32Array,
      size: 1
    },
    numericProps: getArrowNumericProps(arrowPolygons.table, [
      'geometry',
      'polygonIndices',
      'featureIds',
      'globalFeatureIds',
      'triangles'
    ]),
    properties: arrowPolygons.properties,
    fields: arrowPolygons.fields
  };
}

/** Maps a typed array to the matching Arrow scalar type. */
function getArrowDataType(values: TypedArray): arrow.DataType {
  if (values instanceof Float64Array) {
    return new arrow.Float64();
  }
  if (values instanceof Float32Array) {
    return new arrow.Float32();
  }
  if (values instanceof Int32Array) {
    return new arrow.Int32();
  }
  if (values instanceof Uint32Array) {
    return new arrow.Uint32();
  }
  if (values instanceof Int16Array) {
    return new arrow.Int16();
  }
  if (values instanceof Uint16Array) {
    return new arrow.Uint16();
  }
  if (values instanceof Int8Array) {
    return new arrow.Int8();
  }
  if (values instanceof Uint8Array) {
    return new arrow.Uint8();
  }

  throw new Error(`Unsupported typed array constructor: ${values.constructor.name}`);
}

/** Wraps a primitive typed array in Arrow data. */
function makePrimitiveData(values: TypedArray): arrow.Data {
  return arrow.makeData({
    type: getArrowDataType(values) as any,
    data: values as SupportedNumericArray
  } as any);
}

/** Wraps a flat positions array in Arrow fixed-size-list coordinate data. */
function makeCoordinateData(values: TypedArray, coordinateSize: number): arrow.Data {
  const valueType = getArrowDataType(values);
  return arrow.makeData({
    type: new arrow.FixedSizeList(coordinateSize, new arrow.Field('value', valueType, false)),
    child: makePrimitiveData(values)
  } as any);
}

/** Builds a single Arrow list column. */
function makeListData(child: arrow.Data, offsets: Int32Array, fieldName: string): arrow.Data {
  return arrow.makeData({
    type: new arrow.List(new arrow.Field(fieldName, child.type, false)),
    valueOffsets: offsets,
    child
  } as any);
}

/** Builds a nested Arrow list column. */
function makeNestedListData(
  child: arrow.Data,
  innerOffsets: Int32Array,
  outerOffsets: Int32Array,
  fieldName: string
): arrow.Data {
  const innerListData = makeListData(child, innerOffsets, fieldName);
  return arrow.makeData({
    type: new arrow.List(new arrow.Field(fieldName, innerListData.type, false)),
    valueOffsets: outerOffsets,
    child: innerListData
  } as any);
}

/** Derives point feature offsets by scanning contiguous feature ids. */
function derivePointOffsets(featureIds: Uint32Array): Int32Array {
  if (featureIds.length === 0) {
    return new Int32Array([0]);
  }

  const offsets = [0];
  let previousFeatureId = featureIds[0];
  for (let vertexIndex = 1; vertexIndex < featureIds.length; vertexIndex++) {
    const featureId = featureIds[vertexIndex];
    if (featureId !== previousFeatureId) {
      offsets.push(vertexIndex);
      previousFeatureId = featureId;
    }
  }
  offsets.push(featureIds.length);
  return Int32Array.from(offsets);
}

/** Derives polygon-to-ring offsets for Arrow nested polygon lists. */
function derivePolygonRingOffsets(
  polygonIndices: Uint32Array,
  primitivePolygonIndices: Uint32Array
): Int32Array {
  const polygonRingOffsets = new Int32Array(polygonIndices.length);
  let primitivePolygonIndex = 0;

  for (let polygonIndex = 0; polygonIndex < polygonIndices.length - 1; polygonIndex++) {
    const polygonEndIndex = polygonIndices[polygonIndex + 1];
    polygonRingOffsets[polygonIndex] = primitivePolygonIndex;

    while (
      primitivePolygonIndex < primitivePolygonIndices.length - 1 &&
      primitivePolygonIndices[primitivePolygonIndex + 1] <= polygonEndIndex
    ) {
      primitivePolygonIndex++;
    }
  }

  polygonRingOffsets[polygonIndices.length - 1] = primitivePolygonIndices.length - 1;
  return polygonRingOffsets;
}

/** Derives per-polygon triangle offsets from flat triangle indices. */
function derivePolygonTriangleOffsets(
  polygonIndices: Uint32Array,
  triangles: Uint32Array
): Int32Array {
  const triangleOffsets = new Int32Array(polygonIndices.length);
  let triangleIndex = 0;

  for (let polygonIndex = 0; polygonIndex < polygonIndices.length - 1; polygonIndex++) {
    const polygonEndIndex = polygonIndices[polygonIndex + 1];
    triangleOffsets[polygonIndex] = triangleIndex;

    while (triangleIndex < triangles.length && triangles[triangleIndex] < polygonEndIndex) {
      triangleIndex += 3;
    }
  }

  triangleOffsets[polygonIndices.length - 1] = triangles.length;
  return triangleOffsets;
}

/** Reconstructs polygon vertex offsets from Arrow polygon-to-ring offsets. */
function derivePolygonIndicesFromRingOffsets(
  polygonRingOffsets: Int32Array,
  primitivePolygonIndices: Uint32Array
): Uint32Array {
  const polygonIndices = new Uint32Array(polygonRingOffsets.length);
  for (let polygonIndex = 0; polygonIndex < polygonRingOffsets.length; polygonIndex++) {
    polygonIndices[polygonIndex] = primitivePolygonIndices[polygonRingOffsets[polygonIndex]];
  }
  return polygonIndices;
}

/** Reinterprets uint32 values as int32 values without copying. */
function reinterpretUint32AsInt32(values: Uint32Array): Int32Array {
  return new Int32Array(values.buffer, values.byteOffset, values.length);
}

/** Reinterprets int32 values as uint32 values without copying. */
function reinterpretInt32AsUint32(values: Int32Array): Uint32Array {
  return new Uint32Array(values.buffer, values.byteOffset, values.length);
}

/** Returns the first and only chunk for a required table column. */
function getRequiredColumnData(table: arrow.Table, columnName: string): arrow.Data {
  const column = table.getChild(columnName);
  if (!column || column.data.length === 0) {
    throw new Error(`Missing Arrow binary feature column "${columnName}".`);
  }
  return column.data[0];
}

/** Returns the first and only chunk for an optional table column. */
function getOptionalColumnData(table: arrow.Table, columnName: string): arrow.Data | null {
  const column = table.getChild(columnName);
  if (!column || column.data.length === 0) {
    return null;
  }
  return column.data[0];
}

/** Extracts coordinate scalar values from a list<fixedsizelist<number>> column. */
function getCoordinateValuesFromListData(geometryData: arrow.Data): TypedArray {
  return geometryData.children[0].children[0].values as TypedArray;
}

/** Extracts coordinate scalar values from a list<list<fixedsizelist<number>>> column. */
function getCoordinateValuesFromNestedListData(geometryData: arrow.Data): TypedArray {
  return geometryData.children[0].children[0].children[0].values as TypedArray;
}

/** Extracts the coordinate tuple size from a list<fixedsizelist<number>> column. */
function getCoordinateSizeFromListData(geometryData: arrow.Data): number {
  return (geometryData.children[0].type as arrow.FixedSizeList).listSize;
}

/** Extracts the coordinate tuple size from a list<list<fixedsizelist<number>>> column. */
function getCoordinateSizeFromNestedListData(geometryData: arrow.Data): number {
  return (geometryData.children[0].children[0].type as arrow.FixedSizeList).listSize;
}

/** Extracts primitive child values from a single list column. */
function getPrimitiveChildValues(data: arrow.Data): TypedArray {
  return data.children[0].values as TypedArray;
}

/** Extracts primitive child values from a nested list column. */
function getPrimitiveChildValuesFromNestedListData(data: arrow.Data): TypedArray {
  return data.children[0].children[0].values as TypedArray;
}

/** Extracts numeric property columns from an Arrow family table. */
function getArrowNumericProps(
  table: arrow.Table,
  reservedColumnNames: string[]
): Record<string, BinaryAttribute> {
  const reservedColumnNameSet = new Set(reservedColumnNames);
  const numericProps: Record<string, BinaryAttribute> = {};

  for (const field of table.schema.fields) {
    if (reservedColumnNameSet.has(field.name)) {
      continue;
    }

    const data = getRequiredColumnData(table, field.name);
    numericProps[field.name] = {
      value: getNumericPropValues(data, field.name),
      size: 1
    };
  }

  return numericProps;
}

/** Extracts flattened numeric property values from a list or nested-list column. */
function getNumericPropValues(data: arrow.Data, fieldName: string): TypedArray {
  if (fieldName === 'geometry') {
    throw new Error('Geometry columns cannot be decoded as numeric props.');
  }

  if (data.children[0]?.children?.[0]?.values) {
    return data.children[0].children[0].values as TypedArray;
  }

  return data.children[0].values as TypedArray;
}
