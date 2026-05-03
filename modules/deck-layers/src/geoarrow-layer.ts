// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type * as arrow from 'apache-arrow';
import {
  CompositeLayer,
  type CompositeLayerProps,
  type DefaultProps,
  type Layer
} from '@deck.gl/core';
import {
  GeoJsonLayer,
  type GeoJsonLayerProps,
  PathLayer,
  type PathLayerProps,
  ScatterplotLayer,
  type ScatterplotLayerProps,
  SolidPolygonLayer,
  type SolidPolygonLayerProps
} from '@deck.gl/layers';
import {
  convertGeometryValuesToBinaryFeatureCollection,
  type GeometryColumnBinaryFeatureCollectionScratch
} from '@loaders.gl/gis';
import type {
  BinaryAttribute,
  BinaryFeatureCollection,
  BinaryLineFeature,
  BinaryPointFeature,
  BinaryPolygonFeature,
  GeoJSONTable,
  TypedArray
} from '@loaders.gl/schema';
import {convertArrowToSchema} from '@loaders.gl/schema-utils';
import type {BinaryDataFromGeoArrow, GeoArrowEncoding} from '@loaders.gl/geoarrow';
import {
  convertGeoArrowToBinaryFeatureCollection,
  convertGeoArrowToTable,
  getGeometryColumnsFromSchema
} from '@loaders.gl/geoarrow';

/** Props for {@link GeoArrowLayer}. */
export type GeoArrowLayerProps = CompositeLayerProps & {
  /** GeoArrow Apache Arrow table to render. */
  data: arrow.Table;
  /** Optional geometry column name when the table contains multiple geometry columns. */
  geometryColumn?: string;
  /** Optional props forwarded to the scatterplot sublayer for point geometries. */
  pointLayerProps?: Partial<ScatterplotLayerProps>;
  /** Optional props forwarded to the path sublayer for line geometries. */
  pathLayerProps?: Partial<PathLayerProps>;
  /** Optional props forwarded to the solid polygon sublayer for polygon geometries. */
  solidPolygonLayerProps?: Partial<SolidPolygonLayerProps>;
};

const defaultProps: DefaultProps<GeoArrowLayerProps> = {
  id: 'geoarrow-layer',
  pointLayerProps: {type: 'object', compare: false, value: {}},
  pathLayerProps: {type: 'object', compare: false, value: {}},
  solidPolygonLayerProps: {type: 'object', compare: false, value: {}}
};

/**
 * Internal deck.gl layer that renders a GeoArrow Apache Arrow table through a matching deck.gl primitive.
 *
 * This class is exported for internal repository use and examples, and is not documented
 * beyond these TSDoc comments.
 */
export class GeoArrowLayer extends CompositeLayer<GeoArrowLayerProps> {
  /** deck.gl layer name used in debugging output. */
  static layerName = 'GeoArrowLayer';

  /** Default props shared across GeoArrow-backed layers. */
  static defaultProps: DefaultProps = defaultProps;

  /** Reusable scratch buffers for direct WKB/WKT rendering. */
  private geometryScratch: GeometryColumnBinaryFeatureCollectionScratch = {};

  /** Renders the GeoArrow table through the matching deck.gl primitive. */
  renderLayers(): Layer[] | Layer | null {
    const {geometryColumn, encoding, column} = getGeometryColumn(
      this.props.data,
      this.props.geometryColumn
    );
    const binaryGeometry = getRenderableBinaryFeatureCollection(
      this.props.data,
      geometryColumn,
      encoding,
      column,
      this.geometryScratch
    );
    const layers: Layer[] = [];

    if (binaryGeometry.points && binaryGeometry.points.positions.value.length > 0) {
      layers.push(
        new ScatterplotLayer({
          ...this.getSubLayerProps({id: 'points'}),
          ...this.props.pointLayerProps,
          data: createPointLayerData(binaryGeometry.points),
          updateTriggers: this.props.pointLayerProps?.updateTriggers
        }) as unknown as Layer
      );
    }

    if (binaryGeometry.lines && binaryGeometry.lines.positions.value.length > 0) {
      layers.push(
        new PathLayer({
          ...this.getSubLayerProps({id: 'lines'}),
          ...this.props.pathLayerProps,
          data: createLineLayerData(binaryGeometry.lines),
          _pathType: 'open',
          updateTriggers: this.props.pathLayerProps?.updateTriggers
        }) as unknown as Layer
      );
    }

    if (binaryGeometry.polygons && binaryGeometry.polygons.positions.value.length > 0) {
      layers.push(
        new SolidPolygonLayer({
          ...this.getSubLayerProps({id: 'polygons'}),
          ...this.props.solidPolygonLayerProps,
          data: createPolygonLayerData(binaryGeometry.polygons),
          _normalize: false,
          updateTriggers: this.props.solidPolygonLayerProps?.updateTriggers
        }) as unknown as Layer
      );
    }

    if (layers.length > 0) {
      return layers;
    }

    return new GeoJsonLayer({
      ...this.getSubLayerProps({id: 'geojson'}),
      ...createGeoJsonLayerProps(
        convertGeoArrowToTable(this.props.data, 'geojson-table'),
        this.props.pointLayerProps,
        this.props.pathLayerProps,
        this.props.solidPolygonLayerProps
      )
    }) as unknown as Layer;
  }
}

/**
 * Builds GeoJsonLayer props for WKB and WKT GeoArrow inputs.
 * @param geoJsonTable GeoJSON table converted from a GeoArrow Arrow table.
 * @param pointLayerProps Point styling props.
 * @param pathLayerProps Line styling props.
 * @param solidPolygonLayerProps Polygon styling props.
 * @returns GeoJsonLayer props shaped from the existing GeoArrowLayer prop surface.
 */
function createGeoJsonLayerProps(
  geoJsonTable: GeoJSONTable,
  pointLayerProps?: Partial<ScatterplotLayerProps>,
  pathLayerProps?: Partial<PathLayerProps>,
  solidPolygonLayerProps?: Partial<SolidPolygonLayerProps>
): Partial<GeoJsonLayerProps> {
  return {
    data: geoJsonTable,
    pointType: 'circle',
    filled: solidPolygonLayerProps?.filled ?? true,
    extruded: solidPolygonLayerProps?.extruded,
    wireframe: solidPolygonLayerProps?.wireframe,
    getFillColor: (pointLayerProps?.getFillColor ??
      solidPolygonLayerProps?.getFillColor) as GeoJsonLayerProps['getFillColor'],
    getLineColor: (pathLayerProps?.getColor ??
      pointLayerProps?.getLineColor ??
      solidPolygonLayerProps?.getLineColor) as GeoJsonLayerProps['getLineColor'],
    getLineWidth: (pathLayerProps?.getWidth ??
      pointLayerProps?.getLineWidth) as GeoJsonLayerProps['getLineWidth'],
    lineWidthUnits: pathLayerProps?.widthUnits,
    getPointRadius: pointLayerProps?.getRadius,
    pointRadiusScale: pointLayerProps?.radiusScale,
    pointRadiusUnits: pointLayerProps?.radiusUnits,
    getElevation: solidPolygonLayerProps?.getElevation
  };
}

/**
 * Resolves the geometry column to render from a GeoArrow Apache Arrow table.
 * @param table GeoArrow Apache Arrow table.
 * @param geometryColumn Optional geometry column override.
 * @returns The resolved geometry column name, encoding, and Arrow vector.
 */
function getGeometryColumn(table: arrow.Table, geometryColumn?: string) {
  const schema = convertArrowToSchema(table.schema);
  const geometryColumns = getGeometryColumnsFromSchema(schema);

  if (geometryColumn) {
    const columnMetadata = geometryColumns[geometryColumn];
    if (!columnMetadata?.encoding) {
      throw new Error(
        `GeoArrowLayer could not find GeoArrow metadata for column "${geometryColumn}".`
      );
    }

    const column = table.getChild(geometryColumn);
    if (!column) {
      throw new Error(`GeoArrowLayer could not read GeoArrow column "${geometryColumn}".`);
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
      'GeoArrowLayer requires exactly one GeoArrow geometry column, but none were found.'
    );
  }

  if (geometryColumnNames.length > 1) {
    throw new Error(
      `GeoArrowLayer requires "geometryColumn" when multiple GeoArrow geometry columns are present: ${geometryColumnNames.join(', ')}.`
    );
  }

  const resolvedGeometryColumn = geometryColumnNames[0];
  const encoding = geometryColumns[resolvedGeometryColumn]?.encoding;
  const column = table.getChild(resolvedGeometryColumn);

  if (!encoding || !column) {
    throw new Error(`GeoArrowLayer could not resolve GeoArrow column "${resolvedGeometryColumn}".`);
  }

  return {
    geometryColumn: resolvedGeometryColumn,
    encoding,
    column
  };
}

/**
 * Resolves a renderable geometry table and encoding for the selected column.
 * @param table GeoArrow Apache Arrow table.
 * @param geometryColumn Geometry column name.
 * @param encoding Source GeoArrow encoding.
 * @returns A renderable table and encoding, or a GeoJSON fallback marker.
 */
function getRenderableBinaryFeatureCollection(
  table: arrow.Table,
  geometryColumn: string,
  encoding: GeoArrowEncoding,
  column: arrow.Vector,
  scratch: GeometryColumnBinaryFeatureCollectionScratch
): BinaryFeatureCollection {
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
        scratch,
        triangulate: true,
        getProperties: createArrowPropertyResolver(table, geometryColumn)
      }
    );
  }

  return {shape: 'binary-feature-collection'};
}

/**
 * Returns true when the encoding renders polygons.
 * @param encoding GeoArrow geometry encoding.
 * @returns `true` when triangulation should be requested.
 */
function isPolygonEncoding(encoding: GeoArrowEncoding): boolean {
  return encoding === 'geoarrow.polygon' || encoding === 'geoarrow.multipolygon';
}

/**
 * Returns true when the encoding can render directly through a deck.gl binary adapter.
 * @param encoding GeoArrow geometry encoding.
 * @returns `true` for native point, line, and polygon encodings.
 */
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

/**
 * Merges chunked GeoArrow binary collections into one binary collection for deck.gl.
 * @param binaryGeometries GeoArrow chunk results.
 * @param encoding GeoArrow geometry encoding.
 * @returns A merged binary feature collection.
 */
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

/**
 * Builds an Arrow row property resolver that excludes the geometry column.
 * @param table Arrow table containing feature attributes.
 * @param geometryColumn Geometry column name.
 * @returns Property resolver for one row index.
 */
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

/**
 * Builds deck.gl binary data for point rendering.
 * @param points Binary point feature collection.
 * @returns deck.gl layer data for `ScatterplotLayer`.
 */
function createPointLayerData(points?: BinaryPointFeature | null) {
  if (!points) {
    return {length: 0, attributes: {}};
  }

  return {
    length: points.positions.value.length / points.positions.size,
    attributes: {
      getPosition: points.positions
    },
    properties: points.properties,
    numericProps: points.numericProps,
    featureIds: points.featureIds
  };
}

/**
 * Builds deck.gl binary data for line rendering.
 * @param lines Binary line feature collection.
 * @returns deck.gl layer data for `PathLayer`.
 */
function createLineLayerData(lines?: BinaryLineFeature | null) {
  if (!lines) {
    return {
      length: 0,
      startIndices: new Uint32Array([0]),
      attributes: {}
    };
  }

  return {
    length: lines.pathIndices.value.length - 1,
    startIndices: lines.pathIndices.value,
    attributes: {
      getPath: lines.positions
    },
    properties: lines.properties,
    numericProps: lines.numericProps,
    featureIds: lines.featureIds
  };
}

/**
 * Builds deck.gl binary data for polygon rendering.
 * @param polygons Binary polygon feature collection.
 * @returns deck.gl layer data for `SolidPolygonLayer`.
 */
function createPolygonLayerData(polygons?: BinaryPolygonFeature | null) {
  if (!polygons) {
    return {
      length: 0,
      startIndices: new Uint32Array([0]),
      attributes: {}
    };
  }

  return {
    length: polygons.polygonIndices.value.length - 1,
    startIndices: polygons.polygonIndices.value,
    attributes: {
      getPolygon: polygons.positions,
      instanceVertexValid: {
        size: 1,
        value: createVertexValid(polygons)
      },
      ...(polygons.triangles ? {indices: polygons.triangles.value} : {})
    },
    properties: polygons.properties,
    numericProps: polygons.numericProps,
    featureIds: polygons.featureIds
  };
}

/**
 * Creates the polygon vertex-valid attribute expected by `SolidPolygonLayer`.
 * @param polygons Binary polygon feature collection.
 * @returns Vertex-valid flags.
 */
function createVertexValid(polygons: BinaryPolygonFeature): Uint16Array {
  const vertexCount = polygons.positions.value.length / polygons.positions.size;
  const vertexValid = new Uint16Array(vertexCount).fill(1);

  for (const index of polygons.primitivePolygonIndices.value) {
    if (index > 0) {
      vertexValid[index - 1] = 0;
    }
  }

  if (vertexCount > 0) {
    vertexValid[vertexCount - 1] = 0;
  }

  return vertexValid;
}

/**
 * Merges point chunks into a single binary point feature collection.
 * @param points Binary point chunks.
 * @returns A merged binary point feature collection.
 */
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

/**
 * Merges line chunks into a single binary line feature collection.
 * @param lines Binary line chunks.
 * @returns A merged binary line feature collection.
 */
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

/**
 * Merges polygon chunks into a single binary polygon feature collection.
 * @param polygons Binary polygon chunks.
 * @returns A merged binary polygon feature collection.
 */
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

/**
 * Concatenates feature-id arrays while offsetting by the chunk property count.
 * @param features Binary features to merge.
 * @returns Concatenated feature ids.
 */
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

/**
 * Concatenates line or polygon start-index arrays while offsetting by the previous vertex count.
 * @param startIndicesArrays Start-index arrays to merge.
 * @returns Concatenated start indices.
 */
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

/**
 * Concatenates numeric properties across chunks.
 * @param features Binary features to merge.
 * @returns Concatenated numeric properties.
 */
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

/**
 * Concatenates typed arrays by bytes.
 * @param arrays Typed arrays to concatenate.
 * @returns A byte-level concatenation of the input arrays.
 */
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

/**
 * Recreates a typed array using the same constructor as a reference array.
 * @param referenceArray Typed array that provides the constructor.
 * @param bytes Concatenated byte buffer.
 * @returns A typed array with the same type as the reference input.
 */
function createTypedArray(referenceArray: TypedArray, bytes: Uint8Array): TypedArray {
  const TypedArrayConstructor = referenceArray.constructor as {
    new (buffer: ArrayBufferLike): TypedArray;
  };
  return new TypedArrayConstructor(bytes.buffer);
}

/**
 * Creates an empty binary point feature collection.
 * @returns An empty binary point feature collection.
 */
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

/**
 * Creates an empty binary line feature collection.
 * @returns An empty binary line feature collection.
 */
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

/**
 * Creates an empty binary polygon feature collection.
 * @returns An empty binary polygon feature collection.
 */
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
