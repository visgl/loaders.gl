// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type * as arrow from 'apache-arrow';
import type {
  BinaryFeatureCollection,
  BinaryPointFeature,
  BinaryLineFeature,
  BinaryPolygonFeature,
  Geometry,
  ObjectRowTable,
  Table
} from '@loaders.gl/schema';
import {convertTable} from '@loaders.gl/schema-utils';
import {earcut} from '@math.gl/polygon';
import {convertWKBToGeometry} from '../geometry-converters/wkb/convert-wkb-to-geometry';
import {convertWKTToGeometry} from '../geometry-converters/wkb/convert-wkt-to-geometry';

/** Supported geometry encodings for direct binary rendering. */
export type GeometryColumnBinaryEncoding = 'wkb' | 'wkt';

/** Scratch buffers for reusable point arrays. */
export type BinaryPointFeatureScratch = {
  /** Flat point positions buffer. */
  positions?: Float64Array;
  /** Per-vertex point feature ids. */
  featureIds?: Uint32Array;
  /** Per-vertex point global feature ids. */
  globalFeatureIds?: Uint32Array;
};

/** Scratch buffers for reusable line arrays. */
export type BinaryLineFeatureScratch = {
  /** Flat line positions buffer. */
  positions?: Float64Array;
  /** Per-vertex line feature ids. */
  featureIds?: Uint32Array;
  /** Per-vertex line global feature ids. */
  globalFeatureIds?: Uint32Array;
  /** Start indices for each line path. */
  pathIndices?: Uint32Array;
};

/** Scratch buffers for reusable polygon arrays. */
export type BinaryPolygonFeatureScratch = {
  /** Flat polygon positions buffer. */
  positions?: Float64Array;
  /** Per-vertex polygon feature ids. */
  featureIds?: Uint32Array;
  /** Per-vertex polygon global feature ids. */
  globalFeatureIds?: Uint32Array;
  /** Start indices for each polygon object. */
  polygonIndices?: Uint32Array;
  /** Start indices for each primitive ring. */
  primitivePolygonIndices?: Uint32Array;
  /** Triangle indices produced during triangulation. */
  triangles?: Uint32Array;
};

/** Reusable scratch buffers for render-ready binary features. */
export type GeometryColumnBinaryFeatureCollectionScratch = {
  /** Scratch buffers for the point bin. */
  points?: BinaryPointFeatureScratch;
  /** Scratch buffers for the line bin. */
  lines?: BinaryLineFeatureScratch;
  /** Scratch buffers for the polygon bin. */
  polygons?: BinaryPolygonFeatureScratch;
};

/** Shared options for direct geometry-column to binary conversion. */
export type GeometryColumnToBinaryFeatureCollectionOptions = {
  /** Geometry encoding. When omitted, the converter infers the first non-null value type. */
  geometryEncoding?: GeometryColumnBinaryEncoding;
  /** Optional reusable scratch buffers. */
  scratch?: GeometryColumnBinaryFeatureCollectionScratch;
  /** Optional property rows to attach to output features. */
  properties?: Record<string, unknown>[];
  /** Optional callback to lazily resolve properties per input row. */
  getProperties?: (rowIndex: number) => Record<string, unknown>;
  /** Optional global feature id offset. */
  globalFeatureIdOffset?: number;
  /** Whether polygons should be triangulated. Defaults to `true`. */
  triangulate?: boolean;
};

/** Options for table-aware geometry-column conversion. */
export type TableGeometryColumnToBinaryFeatureCollectionOptions =
  GeometryColumnToBinaryFeatureCollectionOptions & {
    /** Column name containing WKB or WKT geometry values. */
    geometryColumn: string;
  };

type GeometryValue = ArrayBufferLike | ArrayBufferView | string | null | undefined;

type GeometryMeasure = {
  points: {
    featureCount: number;
    vertexCount: number;
    coordinateLength: 2 | 3 | 4;
  };
  lines: {
    featureCount: number;
    pathCount: number;
    vertexCount: number;
    coordinateLength: 2 | 3 | 4;
  };
  polygons: {
    featureCount: number;
    polygonCount: number;
    primitivePolygonCount: number;
    vertexCount: number;
    coordinateLength: 2 | 3 | 4;
  };
};

type FillState = {
  points: {
    positionValueIndex: number;
    vertexIndex: number;
    featureIndex: number;
    properties: Record<string, unknown>[];
  };
  lines: {
    positionValueIndex: number;
    vertexIndex: number;
    pathIndex: number;
    featureIndex: number;
    properties: Record<string, unknown>[];
  };
  polygons: {
    positionValueIndex: number;
    vertexIndex: number;
    polygonIndex: number;
    primitivePolygonIndex: number;
    featureIndex: number;
    properties: Record<string, unknown>[];
  };
};

type RowFeatureState = {
  pointFeatureIndex?: number;
  lineFeatureIndex?: number;
  polygonFeatureIndex?: number;
};

/**
 * Converts a WKB or WKT geometry column to a render-ready binary feature collection.
 * @param geometryValues Geometry values to convert.
 * @param options Conversion options.
 * @returns Binary features grouped by render family.
 */
export function convertGeometryValuesToBinaryFeatureCollection(
  geometryValues: ArrayLike<GeometryValue>,
  options: GeometryColumnToBinaryFeatureCollectionOptions = {}
): BinaryFeatureCollection {
  const geometryEncoding = options.geometryEncoding || inferGeometryEncoding(geometryValues);
  const triangulate = options.triangulate !== false;
  const measure = createEmptyMeasure();

  for (let rowIndex = 0; rowIndex < geometryValues.length; rowIndex++) {
    const geometry = decodeGeometryValue(
      getGeometryValue(geometryValues, rowIndex),
      geometryEncoding
    );
    measureGeometry(geometry, measure);
  }

  const allocatedScratch = allocateScratch(measure, options.scratch);
  const binaryFeatures = initializeBinaryFeatureCollection(measure, allocatedScratch);
  const fillState = createInitialFillState();

  for (let rowIndex = 0; rowIndex < geometryValues.length; rowIndex++) {
    const geometry = decodeGeometryValue(
      getGeometryValue(geometryValues, rowIndex),
      geometryEncoding
    );
    if (!geometry) {
      continue;
    }

    const globalFeatureId = rowIndex + (options.globalFeatureIdOffset || 0);
    const properties = resolveProperties(rowIndex, globalFeatureId, options);
    const rowFeatureState: RowFeatureState = {};
    fillGeometry(geometry, binaryFeatures, fillState, rowFeatureState, properties, globalFeatureId);
  }

  finalizeFeatureCollection(binaryFeatures, fillState);

  if (triangulate && binaryFeatures.polygons) {
    const triangles = triangulatePolygons(binaryFeatures.polygons);
    if (triangles) {
      let polygonScratch = allocatedScratch.polygons;
      if (!polygonScratch) {
        polygonScratch = {};
        allocatedScratch.polygons = polygonScratch;
      }
      polygonScratch.triangles = ensureUint32Capacity(polygonScratch.triangles, triangles.length);
      polygonScratch.triangles.set(triangles);
      binaryFeatures.polygons.triangles = {
        value: polygonScratch.triangles.subarray(0, triangles.length),
        size: 1
      };
    }
  }

  return binaryFeatures;
}

/**
 * Converts a table geometry column to a render-ready binary feature collection.
 * @param table Geometry source table.
 * @param options Conversion options.
 * @returns Binary features grouped by render family.
 */
export function convertGeometryColumnToBinaryFeatureCollection(
  table: Table | arrow.Table,
  options: TableGeometryColumnToBinaryFeatureCollectionOptions
): BinaryFeatureCollection {
  const geometryValues = getGeometryValuesFromTable(table, options.geometryColumn);
  const propertyResolver = getPropertyResolver(table, options.geometryColumn);

  return convertGeometryValuesToBinaryFeatureCollection(geometryValues, {
    ...options,
    getProperties: options.getProperties || propertyResolver
  });
}

function getGeometryValuesFromTable(
  table: Table | arrow.Table,
  geometryColumn: string
): ArrayLike<GeometryValue> {
  if (isArrowTableLike(table)) {
    const geometryValues = table.getChild(geometryColumn);
    if (!geometryValues) {
      throw new Error(`Could not find geometry column "${geometryColumn}".`);
    }
    return geometryValues as unknown as ArrayLike<GeometryValue>;
  }

  const objectRowTable =
    table.shape === 'object-row-table' ? table : convertTable(table, 'object-row-table');
  return objectRowTable.data.map(row => row[geometryColumn] as GeometryValue);
}

function getPropertyResolver(
  table: Table | arrow.Table,
  geometryColumn: string
): (rowIndex: number) => Record<string, unknown> {
  if (isArrowTableLike(table)) {
    const columnNames = table.schema.fields
      .map(field => field.name)
      .filter(fieldName => fieldName !== geometryColumn);
    return (rowIndex: number) => {
      const properties: Record<string, unknown> = {};
      for (const columnName of columnNames) {
        properties[columnName] = table.getChild(columnName)?.get(rowIndex);
      }
      return properties;
    };
  }

  const objectRowTable: ObjectRowTable =
    table.shape === 'object-row-table' ? table : convertTable(table, 'object-row-table');
  return (rowIndex: number) => {
    const row = objectRowTable.data[rowIndex] || {};
    const {[geometryColumn]: _geometry, ...properties} = row;
    return properties;
  };
}

function isArrowTableLike(table: Table | arrow.Table): table is arrow.Table {
  return Boolean(
    table &&
      typeof (table as arrow.Table).getChild === 'function' &&
      (table as arrow.Table).schema?.fields
  );
}

function createEmptyMeasure(): GeometryMeasure {
  return {
    points: {featureCount: 0, vertexCount: 0, coordinateLength: 2},
    lines: {featureCount: 0, pathCount: 0, vertexCount: 0, coordinateLength: 2},
    polygons: {
      featureCount: 0,
      polygonCount: 0,
      primitivePolygonCount: 0,
      vertexCount: 0,
      coordinateLength: 2
    }
  };
}

function measureGeometry(geometry: Geometry | null, measure: GeometryMeasure): void {
  if (!geometry) {
    return;
  }

  const rowFamilyState = {
    points: false,
    lines: false,
    polygons: false
  };
  measureGeometryRecursive(geometry, measure, rowFamilyState);
}

function measureGeometryRecursive(
  geometry: Geometry,
  measure: GeometryMeasure,
  rowFamilyState: {points: boolean; lines: boolean; polygons: boolean}
): void {
  switch (geometry.type) {
    case 'Point':
      if (!rowFamilyState.points) {
        measure.points.featureCount++;
        rowFamilyState.points = true;
      }
      measure.points.vertexCount += 1;
      measure.points.coordinateLength = Math.max(
        measure.points.coordinateLength,
        getPositionCoordinateLength(geometry.coordinates)
      ) as 2 | 3 | 4;
      return;

    case 'MultiPoint':
      if (!rowFamilyState.points) {
        measure.points.featureCount++;
        rowFamilyState.points = true;
      }
      measure.points.vertexCount += geometry.coordinates.length;
      measure.points.coordinateLength = Math.max(
        measure.points.coordinateLength,
        getPositionArrayCoordinateLength(geometry.coordinates)
      ) as 2 | 3 | 4;
      return;

    case 'LineString':
      if (!rowFamilyState.lines) {
        measure.lines.featureCount++;
        rowFamilyState.lines = true;
      }
      measure.lines.pathCount += 1;
      measure.lines.vertexCount += geometry.coordinates.length;
      measure.lines.coordinateLength = Math.max(
        measure.lines.coordinateLength,
        getPositionArrayCoordinateLength(geometry.coordinates)
      ) as 2 | 3 | 4;
      return;

    case 'MultiLineString':
      if (!rowFamilyState.lines) {
        measure.lines.featureCount++;
        rowFamilyState.lines = true;
      }
      measure.lines.pathCount += geometry.coordinates.length;
      for (const lineString of geometry.coordinates) {
        measure.lines.vertexCount += lineString.length;
        measure.lines.coordinateLength = Math.max(
          measure.lines.coordinateLength,
          getPositionArrayCoordinateLength(lineString)
        ) as 2 | 3 | 4;
      }
      return;

    case 'Polygon':
      if (!rowFamilyState.polygons) {
        measure.polygons.featureCount++;
        rowFamilyState.polygons = true;
      }
      measure.polygons.polygonCount += 1;
      measure.polygons.primitivePolygonCount += geometry.coordinates.length;
      for (const ring of geometry.coordinates) {
        measure.polygons.vertexCount += ring.length;
        measure.polygons.coordinateLength = Math.max(
          measure.polygons.coordinateLength,
          getPositionArrayCoordinateLength(ring)
        ) as 2 | 3 | 4;
      }
      return;

    case 'MultiPolygon':
      if (!rowFamilyState.polygons) {
        measure.polygons.featureCount++;
        rowFamilyState.polygons = true;
      }
      measure.polygons.polygonCount += geometry.coordinates.length;
      for (const polygon of geometry.coordinates) {
        measure.polygons.primitivePolygonCount += polygon.length;
        for (const ring of polygon) {
          measure.polygons.vertexCount += ring.length;
          measure.polygons.coordinateLength = Math.max(
            measure.polygons.coordinateLength,
            getPositionArrayCoordinateLength(ring)
          ) as 2 | 3 | 4;
        }
      }
      return;

    case 'GeometryCollection':
      for (const childGeometry of geometry.geometries) {
        measureGeometryRecursive(childGeometry, measure, rowFamilyState);
      }
      return;

    default:
      throw new Error(`Unsupported geometry type "${(geometry as Geometry).type}".`);
  }
}

function allocateScratch(
  measure: GeometryMeasure,
  scratch: GeometryColumnBinaryFeatureCollectionScratch = {}
): GeometryColumnBinaryFeatureCollectionScratch {
  if (measure.points.vertexCount > 0) {
    let pointScratch = scratch.points;
    if (!pointScratch) {
      pointScratch = {};
      scratch.points = pointScratch;
    }
    pointScratch.positions = ensureFloat64Capacity(
      pointScratch.positions,
      measure.points.vertexCount * measure.points.coordinateLength
    );
    pointScratch.featureIds = ensureUint32Capacity(
      pointScratch.featureIds,
      measure.points.vertexCount
    );
    pointScratch.globalFeatureIds = ensureUint32Capacity(
      pointScratch.globalFeatureIds,
      measure.points.vertexCount
    );
  }

  if (measure.lines.vertexCount > 0 || measure.lines.pathCount > 0) {
    let lineScratch = scratch.lines;
    if (!lineScratch) {
      lineScratch = {};
      scratch.lines = lineScratch;
    }
    lineScratch.positions = ensureFloat64Capacity(
      lineScratch.positions,
      measure.lines.vertexCount * measure.lines.coordinateLength
    );
    lineScratch.featureIds = ensureUint32Capacity(
      lineScratch.featureIds,
      measure.lines.vertexCount
    );
    lineScratch.globalFeatureIds = ensureUint32Capacity(
      lineScratch.globalFeatureIds,
      measure.lines.vertexCount
    );
    lineScratch.pathIndices = ensureUint32Capacity(
      lineScratch.pathIndices,
      measure.lines.pathCount + 1
    );
  }

  if (measure.polygons.vertexCount > 0 || measure.polygons.polygonCount > 0) {
    let polygonScratch = scratch.polygons;
    if (!polygonScratch) {
      polygonScratch = {};
      scratch.polygons = polygonScratch;
    }
    polygonScratch.positions = ensureFloat64Capacity(
      polygonScratch.positions,
      measure.polygons.vertexCount * measure.polygons.coordinateLength
    );
    polygonScratch.featureIds = ensureUint32Capacity(
      polygonScratch.featureIds,
      measure.polygons.vertexCount
    );
    polygonScratch.globalFeatureIds = ensureUint32Capacity(
      polygonScratch.globalFeatureIds,
      measure.polygons.vertexCount
    );
    polygonScratch.polygonIndices = ensureUint32Capacity(
      polygonScratch.polygonIndices,
      measure.polygons.polygonCount + 1
    );
    polygonScratch.primitivePolygonIndices = ensureUint32Capacity(
      polygonScratch.primitivePolygonIndices,
      measure.polygons.primitivePolygonCount + 1
    );
  }

  return scratch;
}

function initializeBinaryFeatureCollection(
  measure: GeometryMeasure,
  scratch: GeometryColumnBinaryFeatureCollectionScratch
): BinaryFeatureCollection {
  const binaryFeatures: BinaryFeatureCollection = {shape: 'binary-feature-collection'};

  if (measure.points.vertexCount > 0) {
    binaryFeatures.points = {
      type: 'Point',
      positions: {
        value: scratch.points!.positions!.subarray(
          0,
          measure.points.vertexCount * measure.points.coordinateLength
        ),
        size: measure.points.coordinateLength
      },
      featureIds: {
        value: scratch.points!.featureIds!.subarray(0, measure.points.vertexCount),
        size: 1
      },
      globalFeatureIds: {
        value: scratch.points!.globalFeatureIds!.subarray(0, measure.points.vertexCount),
        size: 1
      },
      properties: [],
      numericProps: {}
    };
  }

  if (measure.lines.vertexCount > 0 || measure.lines.pathCount > 0) {
    binaryFeatures.lines = {
      type: 'LineString',
      positions: {
        value: scratch.lines!.positions!.subarray(
          0,
          measure.lines.vertexCount * measure.lines.coordinateLength
        ),
        size: measure.lines.coordinateLength
      },
      pathIndices: {
        value: scratch.lines!.pathIndices!.subarray(0, measure.lines.pathCount + 1),
        size: 1
      },
      featureIds: {
        value: scratch.lines!.featureIds!.subarray(0, measure.lines.vertexCount),
        size: 1
      },
      globalFeatureIds: {
        value: scratch.lines!.globalFeatureIds!.subarray(0, measure.lines.vertexCount),
        size: 1
      },
      properties: [],
      numericProps: {}
    };
  }

  if (measure.polygons.vertexCount > 0 || measure.polygons.polygonCount > 0) {
    binaryFeatures.polygons = {
      type: 'Polygon',
      positions: {
        value: scratch.polygons!.positions!.subarray(
          0,
          measure.polygons.vertexCount * measure.polygons.coordinateLength
        ),
        size: measure.polygons.coordinateLength
      },
      polygonIndices: {
        value: scratch.polygons!.polygonIndices!.subarray(0, measure.polygons.polygonCount + 1),
        size: 1
      },
      primitivePolygonIndices: {
        value: scratch.polygons!.primitivePolygonIndices!.subarray(
          0,
          measure.polygons.primitivePolygonCount + 1
        ),
        size: 1
      },
      featureIds: {
        value: scratch.polygons!.featureIds!.subarray(0, measure.polygons.vertexCount),
        size: 1
      },
      globalFeatureIds: {
        value: scratch.polygons!.globalFeatureIds!.subarray(0, measure.polygons.vertexCount),
        size: 1
      },
      properties: [],
      numericProps: {}
    };
  }

  return binaryFeatures;
}

function createInitialFillState(): FillState {
  return {
    points: {positionValueIndex: 0, vertexIndex: 0, featureIndex: 0, properties: []},
    lines: {positionValueIndex: 0, vertexIndex: 0, pathIndex: 0, featureIndex: 0, properties: []},
    polygons: {
      positionValueIndex: 0,
      vertexIndex: 0,
      polygonIndex: 0,
      primitivePolygonIndex: 0,
      featureIndex: 0,
      properties: []
    }
  };
}

function fillGeometry(
  geometry: Geometry,
  binaryFeatures: BinaryFeatureCollection,
  fillState: FillState,
  rowFeatureState: RowFeatureState,
  properties: Record<string, unknown>,
  globalFeatureId: number
): void {
  switch (geometry.type) {
    case 'Point': {
      const featureIndex = getOrCreatePointFeatureIndex(
        binaryFeatures,
        fillState,
        rowFeatureState,
        properties
      );
      writePointPosition(
        binaryFeatures.points!,
        fillState.points,
        featureIndex,
        globalFeatureId,
        geometry.coordinates
      );
      return;
    }

    case 'MultiPoint': {
      const featureIndex = getOrCreatePointFeatureIndex(
        binaryFeatures,
        fillState,
        rowFeatureState,
        properties
      );
      for (const position of geometry.coordinates) {
        writePointPosition(
          binaryFeatures.points!,
          fillState.points,
          featureIndex,
          globalFeatureId,
          position
        );
      }
      return;
    }

    case 'LineString': {
      const featureIndex = getOrCreateLineFeatureIndex(
        binaryFeatures,
        fillState,
        rowFeatureState,
        properties
      );
      writeLineString(
        binaryFeatures.lines!,
        fillState.lines,
        featureIndex,
        globalFeatureId,
        geometry.coordinates
      );
      return;
    }

    case 'MultiLineString': {
      const featureIndex = getOrCreateLineFeatureIndex(
        binaryFeatures,
        fillState,
        rowFeatureState,
        properties
      );
      for (const lineString of geometry.coordinates) {
        writeLineString(
          binaryFeatures.lines!,
          fillState.lines,
          featureIndex,
          globalFeatureId,
          lineString
        );
      }
      return;
    }

    case 'Polygon': {
      const featureIndex = getOrCreatePolygonFeatureIndex(
        binaryFeatures,
        fillState,
        rowFeatureState,
        properties
      );
      writePolygon(
        binaryFeatures.polygons!,
        fillState.polygons,
        featureIndex,
        globalFeatureId,
        geometry.coordinates
      );
      return;
    }

    case 'MultiPolygon': {
      const featureIndex = getOrCreatePolygonFeatureIndex(
        binaryFeatures,
        fillState,
        rowFeatureState,
        properties
      );
      for (const polygon of geometry.coordinates) {
        writePolygon(
          binaryFeatures.polygons!,
          fillState.polygons,
          featureIndex,
          globalFeatureId,
          polygon
        );
      }
      return;
    }

    case 'GeometryCollection':
      for (const childGeometry of geometry.geometries) {
        fillGeometry(
          childGeometry,
          binaryFeatures,
          fillState,
          rowFeatureState,
          properties,
          globalFeatureId
        );
      }
      return;
  }
}

function finalizeFeatureCollection(
  binaryFeatures: BinaryFeatureCollection,
  fillState: FillState
): void {
  if (binaryFeatures.points) {
    binaryFeatures.points.properties = fillState.points.properties;
  }
  if (binaryFeatures.lines) {
    binaryFeatures.lines.pathIndices.value[fillState.lines.pathIndex] = fillState.lines.vertexIndex;
    binaryFeatures.lines.properties = fillState.lines.properties;
  }
  if (binaryFeatures.polygons) {
    binaryFeatures.polygons.polygonIndices.value[fillState.polygons.polygonIndex] =
      fillState.polygons.vertexIndex;
    binaryFeatures.polygons.primitivePolygonIndices.value[
      fillState.polygons.primitivePolygonIndex
    ] = fillState.polygons.vertexIndex;
    binaryFeatures.polygons.properties = fillState.polygons.properties;
  }
}

function getOrCreatePointFeatureIndex(
  binaryFeatures: BinaryFeatureCollection,
  fillState: FillState,
  rowFeatureState: RowFeatureState,
  properties: Record<string, unknown>
): number {
  if (rowFeatureState.pointFeatureIndex !== undefined) {
    return rowFeatureState.pointFeatureIndex;
  }
  if (!binaryFeatures.points) {
    throw new Error('Point feature buffer was not allocated.');
  }
  rowFeatureState.pointFeatureIndex = fillState.points.featureIndex++;
  fillState.points.properties.push(properties);
  return rowFeatureState.pointFeatureIndex;
}

function getOrCreateLineFeatureIndex(
  binaryFeatures: BinaryFeatureCollection,
  fillState: FillState,
  rowFeatureState: RowFeatureState,
  properties: Record<string, unknown>
): number {
  if (rowFeatureState.lineFeatureIndex !== undefined) {
    return rowFeatureState.lineFeatureIndex;
  }
  if (!binaryFeatures.lines) {
    throw new Error('Line feature buffer was not allocated.');
  }
  rowFeatureState.lineFeatureIndex = fillState.lines.featureIndex++;
  fillState.lines.properties.push(properties);
  return rowFeatureState.lineFeatureIndex;
}

function getOrCreatePolygonFeatureIndex(
  binaryFeatures: BinaryFeatureCollection,
  fillState: FillState,
  rowFeatureState: RowFeatureState,
  properties: Record<string, unknown>
): number {
  if (rowFeatureState.polygonFeatureIndex !== undefined) {
    return rowFeatureState.polygonFeatureIndex;
  }
  if (!binaryFeatures.polygons) {
    throw new Error('Polygon feature buffer was not allocated.');
  }
  rowFeatureState.polygonFeatureIndex = fillState.polygons.featureIndex++;
  fillState.polygons.properties.push(properties);
  return rowFeatureState.polygonFeatureIndex;
}

function writePointPosition(
  points: BinaryPointFeature,
  fillState: FillState['points'],
  featureIndex: number,
  globalFeatureId: number,
  position: number[]
): void {
  writePosition(
    points.positions.value as Float64Array,
    fillState.positionValueIndex,
    points.positions.size,
    position
  );
  points.featureIds.value[fillState.vertexIndex] = featureIndex;
  points.globalFeatureIds.value[fillState.vertexIndex] = globalFeatureId;
  fillState.positionValueIndex += points.positions.size;
  fillState.vertexIndex += 1;
}

function writeLineString(
  lines: BinaryLineFeature,
  fillState: FillState['lines'],
  featureIndex: number,
  globalFeatureId: number,
  lineString: number[][]
): void {
  lines.pathIndices.value[fillState.pathIndex++] = fillState.vertexIndex;
  for (const position of lineString) {
    writePosition(
      lines.positions.value as Float64Array,
      fillState.positionValueIndex,
      lines.positions.size,
      position
    );
    lines.featureIds.value[fillState.vertexIndex] = featureIndex;
    lines.globalFeatureIds.value[fillState.vertexIndex] = globalFeatureId;
    fillState.positionValueIndex += lines.positions.size;
    fillState.vertexIndex += 1;
  }
}

function writePolygon(
  polygons: BinaryPolygonFeature,
  fillState: FillState['polygons'],
  featureIndex: number,
  globalFeatureId: number,
  polygon: number[][][]
): void {
  polygons.polygonIndices.value[fillState.polygonIndex++] = fillState.vertexIndex;
  for (const ring of polygon) {
    polygons.primitivePolygonIndices.value[fillState.primitivePolygonIndex++] =
      fillState.vertexIndex;
    for (const position of ring) {
      writePosition(
        polygons.positions.value as Float64Array,
        fillState.positionValueIndex,
        polygons.positions.size,
        position
      );
      polygons.featureIds.value[fillState.vertexIndex] = featureIndex;
      polygons.globalFeatureIds.value[fillState.vertexIndex] = globalFeatureId;
      fillState.positionValueIndex += polygons.positions.size;
      fillState.vertexIndex += 1;
    }
  }
}

function writePosition(
  positions: Float64Array,
  startIndex: number,
  outputCoordinateLength: number,
  position: number[]
): void {
  for (let coordinateIndex = 0; coordinateIndex < outputCoordinateLength; coordinateIndex++) {
    positions[startIndex + coordinateIndex] = position[coordinateIndex] || 0;
  }
}

function triangulatePolygons(polygons: BinaryPolygonFeature): Uint32Array | null {
  try {
    let primitivePolygonIndex = 0;
    const triangles: number[] = [];

    for (
      let polygonIndex = 0;
      polygonIndex < polygons.polygonIndices.value.length - 1;
      polygonIndex++
    ) {
      const startIndex = polygons.polygonIndices.value[polygonIndex];
      const endIndex = polygons.polygonIndices.value[polygonIndex + 1];
      const polygonPositions = polygons.positions.value.subarray(
        startIndex * polygons.positions.size,
        endIndex * polygons.positions.size
      );
      const holeIndices: number[] = [];

      while (polygons.primitivePolygonIndices.value[primitivePolygonIndex] < endIndex) {
        const primitiveIndex = polygons.primitivePolygonIndices.value[primitivePolygonIndex];
        if (primitiveIndex > startIndex) {
          holeIndices.push(primitiveIndex - startIndex);
        }
        primitivePolygonIndex++;
      }

      const polygonTriangles = earcut(
        polygonPositions,
        holeIndices.length > 0 ? holeIndices : undefined,
        polygons.positions.size
      );
      if (polygonTriangles.length === 0) {
        throw new Error('earcut failed e.g. invalid polygon');
      }
      for (const triangleIndex of polygonTriangles) {
        triangles.push(triangleIndex + startIndex);
      }
    }

    return Uint32Array.from(triangles);
  } catch {
    return null;
  }
}

function resolveProperties(
  rowIndex: number,
  globalFeatureId: number,
  options: GeometryColumnToBinaryFeatureCollectionOptions
): Record<string, unknown> {
  if (options.getProperties) {
    return options.getProperties(rowIndex);
  }
  if (options.properties) {
    return options.properties[rowIndex] || {};
  }
  return {index: globalFeatureId};
}

function decodeGeometryValue(
  geometryValue: GeometryValue,
  geometryEncoding: GeometryColumnBinaryEncoding
): Geometry | null {
  if (geometryValue === null || geometryValue === undefined) {
    return null;
  }

  switch (geometryEncoding) {
    case 'wkb':
      return convertWKBToGeometry(normalizeBinaryGeometryValue(geometryValue));
    case 'wkt':
      if (typeof geometryValue !== 'string') {
        throw new Error('WKT geometry columns must contain string values.');
      }
      return convertWKTToGeometry(geometryValue);
    default:
      throw new Error(`Unsupported geometry encoding "${geometryEncoding}".`);
  }
}

function normalizeBinaryGeometryValue(geometryValue: GeometryValue): ArrayBufferLike {
  if (geometryValue instanceof ArrayBuffer) {
    return geometryValue;
  }
  if (ArrayBuffer.isView(geometryValue)) {
    return geometryValue.buffer.slice(
      geometryValue.byteOffset,
      geometryValue.byteOffset + geometryValue.byteLength
    );
  }
  throw new Error('WKB geometry columns must contain ArrayBuffer or typed array values.');
}

function inferGeometryEncoding(
  geometryValues: ArrayLike<GeometryValue>
): GeometryColumnBinaryEncoding {
  for (let rowIndex = 0; rowIndex < geometryValues.length; rowIndex++) {
    const value = getGeometryValue(geometryValues, rowIndex);
    if (value === null || value === undefined) {
      continue;
    }
    if (typeof value === 'string') {
      return 'wkt';
    }
    if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
      return 'wkb';
    }
  }
  return 'wkb';
}

function getGeometryValue(
  geometryValues: ArrayLike<GeometryValue>,
  rowIndex: number
): GeometryValue {
  const valuesWithGetter = geometryValues as ArrayLike<GeometryValue> & {
    get?: (index: number) => GeometryValue;
  };
  return valuesWithGetter.get ? valuesWithGetter.get(rowIndex) : geometryValues[rowIndex];
}

function ensureFloat64Capacity(
  array: Float64Array | undefined,
  minimumLength: number
): Float64Array {
  if (array && array.length >= minimumLength) {
    return array;
  }
  return new Float64Array(minimumLength);
}

function ensureUint32Capacity(array: Uint32Array | undefined, minimumLength: number): Uint32Array {
  if (array && array.length >= minimumLength) {
    return array;
  }
  return new Uint32Array(minimumLength);
}

function getPositionCoordinateLength(position: number[]): 2 | 3 | 4 {
  return Math.min(Math.max(position.length, 2), 4) as 2 | 3 | 4;
}

function getPositionArrayCoordinateLength(positions: number[][]): 2 | 3 | 4 {
  for (const position of positions) {
    if (position.length > 0) {
      return getPositionCoordinateLength(position);
    }
  }
  return 2;
}
