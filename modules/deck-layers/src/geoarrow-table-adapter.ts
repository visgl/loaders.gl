// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type * as arrow from 'apache-arrow';
import {
  deserializeArrowTableFromIPC,
  hydrateArrowTable,
  type DehydratedArrowTable,
  type SerializedArrowTableIPC
} from '@loaders.gl/arrow/transport';
import {
  convertGeometryValuesToBinaryFeatureCollection,
  type GeometryColumnBinaryFeatureCollectionScratch
} from '@loaders.gl/gis';
import type {
  ArrowTable,
  BinaryAttribute,
  BinaryFeatureCollection,
  BinaryLineFeature,
  BinaryPointFeature,
  BinaryPolygonFeature,
  TypedArray
} from '@loaders.gl/schema';
import {convertArrowToSchema} from '@loaders.gl/schema-utils';
import type {BinaryDataFromGeoArrow, GeoArrowEncoding} from '@loaders.gl/geoarrow';
import {
  convertGeoArrowToBinaryFeatureCollection,
  getGeometryColumnsFromSchema
} from '@loaders.gl/geoarrow';

/** GeoArrow table input accepted by the deck.gl Arrow adapter. */
export type GeoArrowTableInput = ArrowTable | arrow.Table;

/** Options for converting a GeoArrow table into deck.gl binary GeoJSON data. */
export type GeoArrowBinaryFeatureCollectionOptions = {
  /** Optional geometry column name when the table contains multiple geometry columns. */
  geometryColumn?: string;
  /** Optional scratch buffers reused across WKB/WKT conversions. */
  scratch?: GeometryColumnBinaryFeatureCollectionScratch;
};

/**
 * Converts a loaders.gl Arrow table wrapper or raw Apache Arrow table into deck.gl binary GeoJSON.
 * @param input GeoArrow table input.
 * @param options Geometry column and scratch-buffer options.
 * @returns A deck.gl-compatible binary feature collection.
 */
export function convertGeoArrowTableToBinaryFeatureCollection(
  input: GeoArrowTableInput,
  options: GeoArrowBinaryFeatureCollectionOptions = {}
): BinaryFeatureCollection {
  const table = getApacheArrowTable(input);
  const {geometryColumn, encoding, column} = getGeoArrowGeometryColumn(
    table,
    options.geometryColumn
  );

  if (isNativeRenderableEncoding(encoding)) {
    const {binaryGeometries} = convertGeoArrowToBinaryFeatureCollection(column, encoding, {
      triangulate: isPolygonEncoding(encoding)
    });
    return mergeNativeBinaryGeometries(binaryGeometries, encoding);
  }

  if (encoding === 'geoarrow.wkb' || encoding === 'geoarrow.wkt') {
    return convertGeometryValuesToBinaryFeatureCollection(
      column as unknown as ArrayLike<ArrayBufferLike | ArrayBufferView | string | null | undefined>,
      {
        geometryEncoding: encoding === 'geoarrow.wkb' ? 'wkb' : 'wkt',
        scratch: options.scratch,
        triangulate: true,
        getProperties: createArrowPropertyResolver(table, geometryColumn)
      }
    );
  }

  return {shape: 'binary-feature-collection'};
}

/**
 * Resolves a raw Apache Arrow table from a loaders.gl wrapper or raw table.
 * @param input GeoArrow table input.
 * @returns Raw Apache Arrow table.
 */
export function getApacheArrowTable(input: GeoArrowTableInput): arrow.Table {
  const table = isLoadersArrowTable(input) ? input.data : input;
  if (isApacheArrowTable(table)) {
    return table;
  }
  if (isDehydratedArrowTable(table)) {
    return hydrateArrowTable(table);
  }
  if (isSerializedArrowTableIPC(table)) {
    return deserializeArrowTableFromIPC(table);
  }
  throw new Error('GeoArrow table adapter expected an Apache Arrow table.');
}

/**
 * Resolves the renderable geometry column from a GeoArrow Apache Arrow table.
 * @param table GeoArrow Apache Arrow table.
 * @param geometryColumn Optional geometry column override.
 * @returns The resolved geometry column name, encoding, and Arrow vector.
 */
export function getGeoArrowGeometryColumn(table: arrow.Table, geometryColumn?: string) {
  const schema = convertArrowToSchema(table.schema);
  const geometryColumns = getGeometryColumnsFromSchema(schema);

  if (geometryColumn) {
    const columnMetadata = geometryColumns[geometryColumn];
    if (!columnMetadata?.encoding) {
      throw new Error(
        `GeoArrow table adapter could not find GeoArrow metadata for column "${geometryColumn}".`
      );
    }

    const column = table.getChild(geometryColumn);
    if (!column) {
      throw new Error(`GeoArrow table adapter could not read GeoArrow column "${geometryColumn}".`);
    }

    return {
      geometryColumn,
      encoding: columnMetadata.encoding,
      column
    };
  }

  const geometryColumnNames = Object.keys(geometryColumns);
  if (geometryColumnNames.length === 0) {
    throw new Error(
      'GeoArrow table adapter requires exactly one GeoArrow geometry column, but none were found.'
    );
  }

  if (geometryColumnNames.length > 1) {
    throw new Error(
      `GeoArrow table adapter requires "geometryColumn" when multiple GeoArrow geometry columns are present: ${geometryColumnNames.join(', ')}.`
    );
  }

  const resolvedGeometryColumn = geometryColumnNames[0];
  const encoding = geometryColumns[resolvedGeometryColumn]?.encoding;
  const column = table.getChild(resolvedGeometryColumn);

  if (!encoding || !column) {
    throw new Error(
      `GeoArrow table adapter could not resolve GeoArrow column "${resolvedGeometryColumn}".`
    );
  }

  return {
    geometryColumn: resolvedGeometryColumn,
    encoding,
    column
  };
}

function isLoadersArrowTable(input: GeoArrowTableInput): input is ArrowTable {
  return (input as ArrowTable).shape === 'arrow-table';
}

function isApacheArrowTable(table: unknown): table is arrow.Table {
  return Boolean(table && typeof (table as arrow.Table).getChild === 'function');
}

function isDehydratedArrowTable(table: unknown): table is DehydratedArrowTable {
  const arrowTable = table as DehydratedArrowTable;
  return Boolean(
    arrowTable &&
      typeof arrowTable === 'object' &&
      arrowTable.shape === 'arrow-table' &&
      arrowTable.transport === 'arrow-js'
  );
}

function isSerializedArrowTableIPC(table: unknown): table is SerializedArrowTableIPC {
  const arrowTable = table as SerializedArrowTableIPC;
  return Boolean(
    arrowTable &&
      typeof arrowTable === 'object' &&
      arrowTable.shape === 'arrow-table' &&
      arrowTable.transport === 'arrow-ipc'
  );
}

function isPolygonEncoding(encoding: GeoArrowEncoding): boolean {
  return encoding === 'geoarrow.polygon' || encoding === 'geoarrow.multipolygon';
}

function isNativeRenderableEncoding(encoding: GeoArrowEncoding): boolean {
  return (
    encoding === 'geoarrow.point' ||
    encoding === 'geoarrow.multipoint' ||
    encoding === 'geoarrow.linestring' ||
    encoding === 'geoarrow.multilinestring' ||
    encoding === 'geoarrow.polygon' ||
    encoding === 'geoarrow.multipolygon'
  );
}

function mergeNativeBinaryGeometries(
  binaryGeometries: BinaryDataFromGeoArrow['binaryGeometries'],
  encoding: GeoArrowEncoding
): BinaryFeatureCollection {
  switch (encoding) {
    case 'geoarrow.point':
    case 'geoarrow.multipoint':
      return {
        shape: 'binary-feature-collection',
        points: mergePointFeatures(binaryGeometries.map(binaryGeometry => binaryGeometry.points))
      };

    case 'geoarrow.linestring':
    case 'geoarrow.multilinestring':
      return {
        shape: 'binary-feature-collection',
        lines: mergeLineFeatures(binaryGeometries.map(binaryGeometry => binaryGeometry.lines))
      };

    case 'geoarrow.polygon':
    case 'geoarrow.multipolygon':
      return {
        shape: 'binary-feature-collection',
        polygons: mergePolygonFeatures(
          binaryGeometries.map(binaryGeometry => binaryGeometry.polygons)
        )
      };

    default:
      return {shape: 'binary-feature-collection'};
  }
}

function createArrowPropertyResolver(table: arrow.Table, geometryColumn: string) {
  const attributeColumns = table.schema.fields
    .map(field => field.name)
    .filter(fieldName => fieldName !== geometryColumn);

  return (rowIndex: number): Record<string, unknown> => {
    const properties: Record<string, unknown> = {};
    for (const attributeColumn of attributeColumns) {
      properties[attributeColumn] = table.getChild(attributeColumn)?.get(rowIndex);
    }
    return properties;
  };
}

function mergePointFeatures(points: Array<BinaryPointFeature | undefined>): BinaryPointFeature {
  const validPoints = points.filter((point): point is BinaryPointFeature => Boolean(point));
  if (validPoints.length === 0) {
    return createEmptyPointFeature();
  }

  return {
    type: 'Point',
    positions: {
      value: new Float64Array(
        concatTypedArrays(validPoints.map(point => point.positions.value)).buffer
      ),
      size: validPoints[0].positions.size
    },
    featureIds: {
      value: concatenateFeatureIds(validPoints),
      size: 1
    },
    globalFeatureIds: {
      value: new Uint32Array(
        concatTypedArrays(validPoints.map(point => point.globalFeatureIds.value)).buffer
      ),
      size: 1
    },
    numericProps: concatenateNumericProps(validPoints),
    properties: validPoints.flatMap(point => point.properties)
  };
}

function mergeLineFeatures(lines: Array<BinaryLineFeature | undefined>): BinaryLineFeature {
  const validLines = lines.filter((line): line is BinaryLineFeature => Boolean(line));
  if (validLines.length === 0) {
    return createEmptyLineFeature();
  }

  return {
    type: 'LineString',
    positions: {
      value: new Float64Array(
        concatTypedArrays(validLines.map(line => line.positions.value)).buffer
      ),
      size: validLines[0].positions.size
    },
    pathIndices: {
      value: concatenateStartIndices(validLines.map(line => line.pathIndices.value)),
      size: 1
    },
    featureIds: {
      value: concatenateFeatureIds(validLines),
      size: 1
    },
    globalFeatureIds: {
      value: new Uint32Array(
        concatTypedArrays(validLines.map(line => line.globalFeatureIds.value)).buffer
      ),
      size: 1
    },
    numericProps: concatenateNumericProps(validLines),
    properties: validLines.flatMap(line => line.properties)
  };
}

function mergePolygonFeatures(
  polygons: Array<BinaryPolygonFeature | undefined>
): BinaryPolygonFeature {
  const validPolygons = polygons.filter((polygon): polygon is BinaryPolygonFeature =>
    Boolean(polygon)
  );
  if (validPolygons.length === 0) {
    return createEmptyPolygonFeature();
  }

  const positionSize = validPolygons[0].positions.size;
  let vertexOffset = 0;
  const polygonIndices = [0];
  const primitivePolygonIndices = [0];
  const triangles: number[] = [];

  for (const polygon of validPolygons) {
    const polygonVertexCount = polygon.positions.value.length / positionSize;
    for (const polygonIndex of polygon.polygonIndices.value.subarray(1)) {
      polygonIndices.push(polygonIndex + vertexOffset);
    }
    for (const primitiveIndex of polygon.primitivePolygonIndices.value.subarray(1)) {
      primitivePolygonIndices.push(primitiveIndex + vertexOffset);
    }
    if (polygon.triangles) {
      for (const triangleIndex of polygon.triangles.value) {
        triangles.push(triangleIndex + vertexOffset);
      }
    }
    vertexOffset += polygonVertexCount;
  }

  return {
    type: 'Polygon',
    positions: {
      value: new Float64Array(
        concatTypedArrays(validPolygons.map(polygon => polygon.positions.value)).buffer
      ),
      size: positionSize
    },
    polygonIndices: {
      value: new Uint32Array(polygonIndices),
      size: 1
    },
    primitivePolygonIndices: {
      value: new Uint32Array(primitivePolygonIndices),
      size: 1
    },
    ...(triangles.length > 0 ? {triangles: {value: new Uint32Array(triangles), size: 1}} : {}),
    featureIds: {
      value: concatenateFeatureIds(validPolygons),
      size: 1
    },
    globalFeatureIds: {
      value: new Uint32Array(
        concatTypedArrays(validPolygons.map(polygon => polygon.globalFeatureIds.value)).buffer
      ),
      size: 1
    },
    numericProps: concatenateNumericProps(validPolygons),
    properties: validPolygons.flatMap(polygon => polygon.properties)
  };
}

function concatenateFeatureIds(
  features: Array<{featureIds: BinaryAttribute; properties: Record<string, unknown>[]}>
): Uint32Array {
  const featureIds = new Uint32Array(
    features.reduce((count, feature) => count + feature.featureIds.value.length, 0)
  );
  let outputOffset = 0;
  let propertyOffset = 0;

  for (const feature of features) {
    for (const featureId of feature.featureIds.value) {
      featureIds[outputOffset++] = featureId + propertyOffset;
    }
    propertyOffset += feature.properties.length;
  }

  return featureIds;
}

function concatenateStartIndices(startIndicesArrays: TypedArray[]): Uint32Array {
  const startIndices: number[] = [0];
  let vertexOffset = 0;

  for (const indices of startIndicesArrays) {
    for (const index of indices.subarray(1)) {
      startIndices.push(index + vertexOffset);
    }
    vertexOffset = startIndices[startIndices.length - 1];
  }

  return new Uint32Array(startIndices);
}

function concatenateNumericProps(features: Array<{numericProps: Record<string, BinaryAttribute>}>) {
  const numericProps: Record<string, BinaryAttribute> = {};
  const propertyNames = new Set(features.flatMap(feature => Object.keys(feature.numericProps)));

  for (const propertyName of propertyNames) {
    const values = features
      .map(feature => feature.numericProps[propertyName])
      .filter((value): value is BinaryAttribute => Boolean(value));

    if (values.length > 0) {
      numericProps[propertyName] = {
        value: createTypedArray(
          values[0].value,
          concatTypedArrays(values.map(value => value.value))
        ),
        size: values[0].size
      };
    }
  }

  return numericProps;
}

function concatTypedArrays(arrays: ArrayBufferView[]): Uint8Array {
  let byteLength = 0;
  for (const array of arrays) {
    byteLength += array.byteLength;
  }

  const concatenated = new Uint8Array(byteLength);
  let byteOffset = 0;

  for (const array of arrays) {
    const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
    concatenated.set(bytes, byteOffset);
    byteOffset += bytes.byteLength;
  }

  return concatenated;
}

function createTypedArray(referenceArray: TypedArray, bytes: Uint8Array): TypedArray {
  const TypedArrayConstructor = referenceArray.constructor as {
    new (buffer: ArrayBufferLike): TypedArray;
  };
  return new TypedArrayConstructor(bytes.buffer);
}

function createEmptyPointFeature(): BinaryPointFeature {
  return {
    type: 'Point',
    positions: {value: new Float64Array(0), size: 2},
    featureIds: {value: new Uint32Array(0), size: 1},
    globalFeatureIds: {value: new Uint32Array(0), size: 1},
    numericProps: {},
    properties: []
  };
}

function createEmptyLineFeature(): BinaryLineFeature {
  return {
    type: 'LineString',
    positions: {value: new Float64Array(0), size: 2},
    pathIndices: {value: new Uint32Array([0]), size: 1},
    featureIds: {value: new Uint32Array(0), size: 1},
    globalFeatureIds: {value: new Uint32Array(0), size: 1},
    numericProps: {},
    properties: []
  };
}

function createEmptyPolygonFeature(): BinaryPolygonFeature {
  return {
    type: 'Polygon',
    positions: {value: new Float64Array(0), size: 2},
    polygonIndices: {value: new Uint32Array([0]), size: 1},
    primitivePolygonIndices: {value: new Uint32Array([0]), size: 1},
    featureIds: {value: new Uint32Array(0), size: 1},
    globalFeatureIds: {value: new Uint32Array(0), size: 1},
    numericProps: {},
    properties: []
  };
}
