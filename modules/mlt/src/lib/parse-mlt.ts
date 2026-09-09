// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {
  ArrowTable,
  Feature,
  GeoJSONTable,
  BinaryFeatureCollection,
  Field,
  Schema,
  GeoParquetGeometryType
} from '@loaders.gl/schema';
import {
  geojsonToBinary,
  makeWKBGeometryField,
  makeWKBGeometryDataFromWriters,
  setWKBGeometrySchemaMetadata,
  GeoArrowBuilder,
  type GeoArrowBuilderDimension,
  type GeoArrowBuilderEncoding,
  type WKBGeometryWriter
} from '@loaders.gl/gis';
import {
  ArrowTableBuilder,
  convertSchemaToArrow,
  getDataTypeFromArray
} from '@loaders.gl/schema-utils';
import type {Feature as MLTFeature} from '@maplibre/mlt';
import * as maplibreMLT from '@maplibre/mlt';

import type {MLTLoaderOptions} from '../mlt-loader';
import {MLT_DEFAULT_OPTIONS} from '../mlt-loader';

type DecodeTile = (tile: Uint8Array) => any;

const decodeTile = (() => {
  const mltModule = maplibreMLT as unknown as {
    decodeTile?: DecodeTile;
    default?: {decodeTile?: DecodeTile};
  };
  const decodedTile = mltModule.decodeTile ?? mltModule.default?.decodeTile;
  if (!decodedTile) {
    throw new Error('MLT Loader: decodeTile export missing from @maplibre/mlt');
  }
  return decodedTile;
})();

type MLTOptions = Required<MLTLoaderOptions>['mlt'];
const GEOMETRY_TYPE = ((): Record<string, number> => {
  const mltModule = maplibreMLT as unknown as {
    GEOMETRY_TYPE?: {[name: string]: number};
    default?: {GEOMETRY_TYPE?: {[name: string]: number}};
  };
  return (
    mltModule.GEOMETRY_TYPE ||
    mltModule.default?.GEOMETRY_TYPE || {
      POINT: 0,
      LINESTRING: 1,
      POLYGON: 2,
      MULTIPOINT: 3,
      MULTILINESTRING: 4,
      MULTIPOLYGON: 5
    }
  );
})();

type MLTFeatureTable = {
  name?: string;
  extent?: number;
  numFeatures?: number;
  geometryVector?: MLTGeometryVector;
  propertyVectors?: MLTPropertyVector[];
  getFeatures?: () => MLTFeature[];
  features?: MLTFeature[];
  [Symbol.iterator]?: () => IterableIterator<MLTFeature>;
};

type MLTPoint = {x: number; y: number};

type MLTGeometry = {
  type: number;
  coordinates: Array<Array<MLTPoint>>;
  extent: number;
};

type MLTGeometryVector = {
  numGeometries: number;
  geometryType: (index: number) => number;
  getGeometries: () => Array<Array<Array<MLTPoint>>>;
};

type MLTPropertyVector = {
  name: string;
  getValue: (index: number) => unknown;
};

/**
 * Parse an MLT ArrayBuffer and return GeoJSON table or binary geometry data.
 *
 * @param arrayBuffer An MLT tile as an ArrayBuffer
 * @param options
 * @returns GeoJSON table or binary feature collection
 */
export function parseMLT(
  arrayBuffer: ArrayBuffer,
  options?: MLTLoaderOptions
): GeoJSONTable | BinaryFeatureCollection | ArrowTable {
  const mltOptions = checkOptions(options);

  const shape = mltOptions.shape;
  switch (shape) {
    case 'geojson-table': {
      const table: GeoJSONTable = {
        shape: 'geojson-table',
        type: 'FeatureCollection',
        features: parseToGeojsonFeatures(arrayBuffer, mltOptions)
      };
      return table;
    }
    case 'binary-geometry': {
      const geojsonFeatures = parseToGeojsonFeatures(arrayBuffer, mltOptions);
      const binaryData = geojsonToBinary(geojsonFeatures);
      // @ts-ignore
      binaryData.byteLength = arrayBuffer.byteLength;
      return binaryData;
    }
    case 'arrow-table':
      return parseToArrowTable(arrayBuffer, mltOptions);
    default:
      throw new Error(shape || 'undefined shape');
  }
}

/**
 * Decode an MLT tile directly into an Arrow table.
 *
 * MLT's decoder already exposes column vectors and a geometry vector. Building Arrow from those
 * vectors avoids materializing GeoJSON features and then decoding the same geometry a second time.
 */
function parseToArrowTable(arrayBuffer: ArrayBuffer, options: MLTOptions): ArrowTable {
  if (arrayBuffer.byteLength <= 0) {
    return makeWKBArrowTable([], [], []);
  }

  const tile = new Uint8Array(arrayBuffer);
  const featureTables = getFeatureTables(decodeTile(tile));
  const selectedLayers =
    options.layers && options.layers.length > 0
      ? options.layers
      : (featureTables.map(ft => ft.name).filter(Boolean) as string[]);
  const propertyRows: Record<string, unknown>[] = [];
  const geometryWriters: (WKBGeometryWriter | null)[] = [];
  const geometries: MLTGeometry[] = [];

  for (const featureTable of featureTables) {
    const layerName = featureTable.name;
    if (!layerName || !selectedLayers.includes(layerName)) {
      continue;
    }

    const geometryVector = featureTable.geometryVector;
    if (!geometryVector) {
      continue;
    }

    const tableGeometries = geometryVector.getGeometries();
    const featureCount = Math.min(geometryVector.numGeometries, tableGeometries.length);
    const propertyVectors = featureTable.propertyVectors || [];
    const extent = featureTable.extent ?? 4096;

    for (let featureIndex = 0; featureIndex < featureCount; featureIndex++) {
      const geometry: MLTGeometry = {
        type: geometryVector.geometryType(featureIndex),
        coordinates: tableGeometries[featureIndex],
        extent
      };
      const properties: Record<string, unknown> = {};
      for (const propertyVector of propertyVectors) {
        properties[propertyVector.name] = normalizePropertyValue(
          propertyVector.getValue(featureIndex)
        );
      }
      if (options.layerProperty) {
        properties[options.layerProperty] = layerName;
      }

      propertyRows.push(properties);
      geometries.push(geometry);
      geometryWriters.push(createWKBGeometryWriter(geometry, options, extent));
    }
  }

  const encodingPreference = options.geoarrow?.encodingPreference;
  if (encodingPreference && encodingPreference !== 'geoarrow.wkb') {
    return makeNativeArrowTable(propertyRows, geometries, options, encodingPreference);
  }
  return makeWKBArrowTable(propertyRows, geometryWriters, geometries);
}

/**
 * Creates a WKB Arrow table from decoded MLT property values and geometry writers.
 */
function makeWKBArrowTable(
  propertyRows: Record<string, unknown>[],
  geometryWriters: (WKBGeometryWriter | null)[],
  geometries: MLTGeometry[]
): ArrowTable {
  const propertySchema = getPropertySchema(propertyRows);
  const schema: Schema = {
    fields: [...propertySchema.fields, makeWKBGeometryField('geometry')],
    metadata: {...(propertySchema.metadata || {})}
  };
  setWKBGeometrySchemaMetadata(schema, {
    geometryColumnName: 'geometry',
    geometryTypes: [
      ...new Set(geometries.map(geometry => geometryTypeToGeoJSONType(geometry.type)))
    ]
      .filter(Boolean)
      .map(type => type as GeoParquetGeometryType)
  });

  const propertyBuilder = new ArrowTableBuilder(propertySchema);
  for (const propertyRow of propertyRows) {
    propertyBuilder.addObjectRow(propertyRow);
  }
  const propertyData = propertyBuilder.finishTable().data;
  const propertyBatch = propertyData.batches[0];
  const geometryData = makeWKBGeometryDataFromWriters(geometryWriters);
  const arrowSchema = convertSchemaToArrow(schema);
  const children = [...(propertyBatch?.data.children || []), geometryData];
  const structData = arrow.makeData({
    type: new arrow.Struct(arrowSchema.fields),
    length: propertyRows.length,
    nullCount: 0,
    children
  } as any);

  return {
    shape: 'arrow-table',
    schema,
    data: new arrow.Table(new arrow.RecordBatch(arrowSchema, structData as any))
  };
}

/**
 * Creates a native GeoArrow table from decoded MLT geometry and property vectors.
 */
function makeNativeArrowTable(
  propertyRows: Record<string, unknown>[],
  geometries: MLTGeometry[],
  options: MLTOptions,
  encodingPreference: Exclude<
    NonNullable<MLTOptions['geoarrow']>['encodingPreference'],
    'geoarrow.wkb'
  >
): ArrowTable {
  const dimension: GeoArrowBuilderDimension = 'xy';
  const encoding = selectGeoArrowEncoding(geometries, encodingPreference);
  const geometryVector =
    encoding === 'geoarrow.geometry'
      ? makeGeoArrowUnionVector(geometries, options, dimension)
      : makeGeoArrowVector(geometries, encoding, options, dimension);
  const propertySchema = getPropertySchema(propertyRows);
  const propertyTableBuilder = new ArrowTableBuilder(propertySchema);
  for (const propertyRow of propertyRows) {
    propertyTableBuilder.addObjectRow(propertyRow);
  }
  const propertyBatch = propertyTableBuilder.finishTable().data.batches[0];
  const propertyArrowSchema = convertSchemaToArrow(propertySchema);
  const geometryTypes = [
    ...new Set(geometries.map(geometry => geometryTypeToGeoJSONType(geometry.type)))
  ]
    .filter(Boolean)
    .map(type => type as GeoParquetGeometryType);
  const geometryField = new arrow.Field(
    'geometry',
    geometryVector.type,
    true,
    new Map([
      ['ARROW:extension:name', encoding],
      ['ARROW:extension:metadata', JSON.stringify({encoding, geometry_types: geometryTypes})]
    ])
  );
  const fields = [...propertyArrowSchema.fields, geometryField];
  const metadata = new Map(propertyArrowSchema.metadata || []);
  metadata.set(
    'geo',
    JSON.stringify({
      version: '1.1.0',
      primary_column: 'geometry',
      columns: {geometry: {encoding, geometry_types: geometryTypes}}
    })
  );
  const arrowSchema = new arrow.Schema(fields, metadata);
  const children = [...(propertyBatch?.data.children || []), geometryVector.data[0]];
  const structData = arrow.makeData({
    type: new arrow.Struct(fields),
    length: propertyRows.length,
    nullCount: 0,
    children
  } as any);
  return {
    shape: 'arrow-table',
    data: new arrow.Table(new arrow.RecordBatch(arrowSchema, structData as any))
  };
}

/** Selects a concrete GeoArrow encoding or the mixed-geometry union encoding. */
function selectGeoArrowEncoding(
  geometries: MLTGeometry[],
  preference: Exclude<NonNullable<MLTOptions['geoarrow']>['encodingPreference'], 'geoarrow.wkb'>
): GeoArrowBuilderEncoding | 'geoarrow.geometry' {
  const geometryTypes = new Set(
    geometries.map(geometry => geometryTypeToGeoJSONType(geometry.type))
  );
  if (preference === 'geoarrow.geometry' || geometryTypes.size === 0) {
    return 'geoarrow.geometry';
  }
  if (geometryTypes.size === 1) {
    return getNativeGeoArrowEncoding([...geometryTypes][0]);
  }
  if (geometryTypes.size === 2) {
    if (geometryTypes.has('Point') && geometryTypes.has('MultiPoint')) {
      return 'geoarrow.multipoint';
    }
    if (geometryTypes.has('LineString') && geometryTypes.has('MultiLineString')) {
      return 'geoarrow.multilinestring';
    }
    if (geometryTypes.has('Polygon') && geometryTypes.has('MultiPolygon')) {
      return 'geoarrow.multipolygon';
    }
  }
  return 'geoarrow.geometry';
}

/** Builds one concrete native GeoArrow vector from MLT geometries. */
function makeGeoArrowVector(
  geometries: MLTGeometry[],
  encoding: GeoArrowBuilderEncoding,
  options: MLTOptions,
  dimension: GeoArrowBuilderDimension
): arrow.Vector {
  const writers = geometries.map(geometry =>
    createGeoArrowGeometryWriter(geometry, encoding, options)
  );
  const geometryArray = GeoArrowBuilder.buildGeometryArray(writers, {encoding, dimension});
  return arrow.makeVector(GeoArrowBuilder.makeGeometryData(geometryArray));
}

/** Builds a dense union GeoArrow vector for mixed geometry columns. */
function makeGeoArrowUnionVector(
  geometries: MLTGeometry[],
  options: MLTOptions,
  dimension: GeoArrowBuilderDimension
): arrow.Vector {
  const geometryGroups = new Map<string, MLTGeometry[]>();
  const typeIds: number[] = [];
  const valueOffsets: number[] = [];
  for (const geometry of geometries) {
    const geometryType = geometryTypeToGeoJSONType(geometry.type) || 'Point';
    const group = geometryGroups.get(geometryType) || [];
    valueOffsets.push(group.length);
    typeIds.push(getUnionTypeId(geometryType, dimension));
    group.push(geometry);
    geometryGroups.set(geometryType, group);
  }

  const orderedGeometryTypes = [...geometryGroups.keys()].sort(
    (left, right) => getUnionTypeId(left, dimension) - getUnionTypeId(right, dimension)
  );
  const childVectors = orderedGeometryTypes.map(geometryType => {
    const encoding = getNativeGeoArrowEncoding(geometryType);
    return makeGeoArrowVector(geometryGroups.get(geometryType)!, encoding, options, dimension);
  });
  const fields = orderedGeometryTypes.map(
    geometryType =>
      new arrow.Field(
        getUnionFieldName(geometryType, dimension),
        childVectors[orderedGeometryTypes.indexOf(geometryType)].type,
        true
      )
  );
  const unionType = new arrow.DenseUnion(
    orderedGeometryTypes.map(geometryType => getUnionTypeId(geometryType, dimension)),
    fields
  );
  return arrow.makeVector(
    arrow.makeData({
      type: unionType,
      length: geometries.length,
      nullCount: 0,
      typeIds: Int8Array.from(typeIds),
      valueOffsets: Int32Array.from(valueOffsets),
      children: childVectors.map(vector => vector.data[0])
    } as any)
  );
}

/** Creates a native GeoArrow writer for one decoded MLT geometry. */
function createGeoArrowGeometryWriter(
  geometry: MLTGeometry,
  encoding: GeoArrowBuilderEncoding,
  options: MLTOptions
): (builder: InstanceType<typeof GeoArrowBuilder>) => void {
  return builder => {
    const coordinates = geometry.coordinates;
    switch (geometryTypeToGeoJSONType(geometry.type)) {
      case 'Point':
        if (encoding === 'geoarrow.multipoint') builder.beginMultiPoint(1);
        builder.beginPoint();
        writeGeoArrowPoint(builder, coordinates[0]?.[0], options, geometry.extent);
        return;
      case 'MultiPoint':
        builder.beginMultiPoint(coordinates.length);
        for (const [point] of coordinates) {
          builder.beginPoint();
          writeGeoArrowPoint(builder, point, options, geometry.extent);
        }
        return;
      case 'LineString':
        if (encoding === 'geoarrow.multilinestring') builder.beginMultiLineString(1);
        writeGeoArrowLineString(builder, coordinates[0] || [], options, geometry.extent);
        return;
      case 'MultiLineString':
        builder.beginMultiLineString(coordinates.length);
        for (const line of coordinates)
          writeGeoArrowLineString(builder, line, options, geometry.extent);
        return;
      case 'Polygon':
        if (encoding === 'geoarrow.multipolygon') builder.beginMultiPolygon(1);
        writeGeoArrowPolygon(builder, coordinates, options, geometry.extent);
        return;
      case 'MultiPolygon':
        builder.beginMultiPolygon(coordinates.length);
        for (const ring of coordinates) {
          builder.beginPolygon(1);
          builder.beginLinearRing(ring.length);
          for (const point of ring) writeGeoArrowPoint(builder, point, options, geometry.extent);
        }
        return;
      default:
        return;
    }
  };
}

function writeGeoArrowPoint(
  builder: InstanceType<typeof GeoArrowBuilder>,
  point: MLTPoint | undefined,
  options: MLTOptions,
  extent: number
): void {
  const [x, y] = projectPoint(point?.x ?? Number.NaN, point?.y ?? Number.NaN, options, extent);
  builder.writeCoordinate(x, y);
}

function writeGeoArrowLineString(
  builder: InstanceType<typeof GeoArrowBuilder>,
  line: MLTPoint[],
  options: MLTOptions,
  extent: number
): void {
  builder.beginLineString(line.length);
  for (const point of line) writeGeoArrowPoint(builder, point, options, extent);
}

function writeGeoArrowPolygon(
  builder: InstanceType<typeof GeoArrowBuilder>,
  rings: MLTPoint[][],
  options: MLTOptions,
  extent: number
): void {
  builder.beginPolygon(rings.length);
  for (const ring of rings) {
    builder.beginLinearRing(ring.length);
    for (const point of ring) writeGeoArrowPoint(builder, point, options, extent);
  }
}

function getNativeGeoArrowEncoding(geometryType: string | null): GeoArrowBuilderEncoding {
  switch (geometryType) {
    case 'Point':
      return 'geoarrow.point';
    case 'LineString':
      return 'geoarrow.linestring';
    case 'Polygon':
      return 'geoarrow.polygon';
    case 'MultiPoint':
      return 'geoarrow.multipoint';
    case 'MultiLineString':
      return 'geoarrow.multilinestring';
    case 'MultiPolygon':
      return 'geoarrow.multipolygon';
    default:
      throw new Error(`MLT Loader: unsupported GeoArrow geometry type ${geometryType}`);
  }
}

function getUnionTypeId(geometryType: string, dimension: GeoArrowBuilderDimension): number {
  const baseTypeIds: Record<string, number> = {
    Point: 1,
    LineString: 2,
    Polygon: 3,
    MultiPoint: 4,
    MultiLineString: 5,
    MultiPolygon: 6
  };
  const dimensionOffset =
    dimension === 'xyz' ? 10 : dimension === 'xym' ? 20 : dimension === 'xyzm' ? 30 : 0;
  return (baseTypeIds[geometryType] || baseTypeIds.Point) + dimensionOffset;
}

function getUnionFieldName(geometryType: string, dimension: GeoArrowBuilderDimension): string {
  return dimension === 'xy' ? geometryType : `${geometryType} ${dimension.slice(1).toUpperCase()}`;
}

/**
 * Builds the property schema using the same primitive normalization as GeoJSON-to-Arrow output.
 */
function getPropertySchema(propertyRows: Record<string, unknown>[]): Schema {
  const fieldNames = new Set<string>();
  for (const propertyRow of propertyRows) {
    for (const fieldName of Object.keys(propertyRow)) {
      fieldNames.add(fieldName);
    }
  }

  return {
    metadata: {},
    fields: [...fieldNames].map((fieldName): Field => {
      const inferredType = getDataTypeFromArray(
        propertyRows.map(propertyRow => propertyRow[fieldName])
      );
      return {
        name: fieldName,
        type: inferredType.type === 'float32' ? 'float64' : inferredType.type,
        nullable: inferredType.nullable
      };
    })
  };
}

function normalizePropertyValue(propertyValue: unknown): unknown {
  if (
    propertyValue === null ||
    propertyValue === undefined ||
    typeof propertyValue === 'string' ||
    typeof propertyValue === 'number' ||
    typeof propertyValue === 'boolean'
  ) {
    return propertyValue ?? null;
  }
  return JSON.stringify(propertyValue);
}

function createWKBGeometryWriter(
  geometry: MLTGeometry,
  options: MLTOptions,
  extent: number
): WKBGeometryWriter | null {
  const geometryType = geometryTypeToGeoJSONType(geometry.type);
  if (!geometryType || !geometry.coordinates) {
    return null;
  }

  const transform = (coordinate: number[]): number[] =>
    projectPoint(coordinate[0], coordinate[1], options, extent);
  return builder => {
    const coordinates = geometry.coordinates;
    switch (geometryType) {
      case 'Point':
        if (!coordinates[0]?.[0]) return;
        builder.beginPoint();
        writePoint(builder, coordinates[0][0], transform);
        return;
      case 'MultiPoint':
        builder.beginMultiPoint(coordinates.length);
        for (const [point] of coordinates) writePoint(builder, point, transform);
        return;
      case 'LineString':
        builder.beginLineString(coordinates[0]?.length || 0);
        for (const point of coordinates[0] || []) writePoint(builder, point, transform);
        return;
      case 'MultiLineString':
        builder.beginMultiLineString(coordinates.length);
        for (const line of coordinates) {
          builder.beginLineString(line.length);
          for (const point of line) writePoint(builder, point, transform);
        }
        return;
      case 'Polygon':
        builder.beginPolygon(coordinates.length);
        for (const ring of coordinates) {
          builder.beginLinearRing(ring.length);
          for (const point of ring) writePoint(builder, point, transform);
        }
        return;
      case 'MultiPolygon':
        // The JS MLT decoder exposes multipolygon rings in a flattened representation. The
        // specification's polygon/ring topology is preserved by treating each decoded ring as
        // a polygon, matching the legacy GeoJSON path until the decoder exposes polygon offsets.
        builder.beginMultiPolygon(coordinates.length);
        for (const ring of coordinates) {
          builder.beginPolygon(1);
          builder.beginLinearRing(ring.length);
          for (const point of ring) writePoint(builder, point, transform);
        }
        return;
      default:
        return;
    }
  };
}

function writePoint(
  builder: Parameters<WKBGeometryWriter>[0],
  point: MLTPoint | undefined,
  transform: (coordinate: number[]) => number[]
): void {
  if (!point) {
    builder.writeCoordinate(Number.NaN, Number.NaN);
    return;
  }
  const [x, y] = transform([point.x, point.y]);
  builder.writeCoordinate(x, y);
}

function geometryTypeToGeoJSONType(
  type: number
): 'Point' | 'LineString' | 'Polygon' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon' | null {
  for (const [name, value] of Object.entries(GEOMETRY_TYPE)) {
    if (value === type) {
      const normalizedName = name.toLowerCase();
      return normalizedName === 'point'
        ? 'Point'
        : normalizedName === 'linestring'
          ? 'LineString'
          : normalizedName === 'polygon'
            ? 'Polygon'
            : normalizedName === 'multipoint'
              ? 'MultiPoint'
              : normalizedName === 'multilinestring'
                ? 'MultiLineString'
                : normalizedName === 'multipolygon'
                  ? 'MultiPolygon'
                  : null;
    }
  }
  return null;
}

/**
 * Parse the MLT tile and return GeoJSON features
 */
function parseToGeojsonFeatures(arrayBuffer: ArrayBuffer, options: MLTOptions): Feature[] {
  if (arrayBuffer.byteLength <= 0) {
    return [];
  }

  const tile = new Uint8Array(arrayBuffer);
  const featureTables = getFeatureTables(decodeTile(tile));

  const features: Feature[] = [];

  const selectedLayers =
    options.layers && options.layers.length > 0
      ? options.layers
      : (featureTables.map(ft => ft.name).filter(Boolean) as string[]);

  for (const featureTable of featureTables) {
    const layerName = featureTable.name;
    if (!layerName || !selectedLayers.includes(layerName)) {
      continue;
    }

    const extent = featureTable.extent ?? 4096;
    for (const mltFeature of getTableFeatures(featureTable)) {
      const geoJSONFeature = convertFeatureToGeoJSON(mltFeature, options, layerName, extent);
      if (geoJSONFeature) {
        features.push(geoJSONFeature);
      }
    }
  }

  return features;
}

function getFeatureTables(decodedTile: unknown): MLTFeatureTable[] {
  if (Array.isArray(decodedTile)) {
    return decodedTile.filter((candidate): candidate is MLTFeatureTable =>
      isFeatureTable(candidate)
    );
  }

  if (!decodedTile || typeof decodedTile !== 'object') {
    return [];
  }

  return Object.values(decodedTile).filter((candidate): candidate is MLTFeatureTable =>
    isFeatureTable(candidate)
  );
}

function isFeatureTable(candidate: unknown): candidate is MLTFeatureTable {
  if (!candidate || typeof candidate !== 'object') {
    return false;
  }
  return (
    typeof (candidate as MLTFeatureTable).name === 'string' &&
    (typeof (candidate as MLTFeatureTable).getFeatures === 'function' ||
      Array.isArray((candidate as MLTFeatureTable).features) ||
      typeof (candidate as MLTFeatureTable)[Symbol.iterator] === 'function')
  );
}

function getTableFeatures(featureTable: MLTFeatureTable): MLTFeature[] {
  if (typeof featureTable.getFeatures === 'function') {
    const features = featureTable.getFeatures();
    if (Array.isArray(features)) {
      return features;
    }
  }

  if (Array.isArray(featureTable.features)) {
    return featureTable.features;
  }

  if (typeof featureTable[Symbol.iterator] === 'function') {
    const iterableFeatures = featureTable[Symbol.iterator]?.();
    if (!iterableFeatures) {
      return [];
    }
    return Array.isArray(iterableFeatures) ? iterableFeatures : Array.from(iterableFeatures);
  }

  return [];
}

/**
 * Convert an MLT Feature to a GeoJSON Feature
 */
function convertFeatureToGeoJSON(
  feature: MLTFeature,
  options: MLTOptions,
  layerName: string,
  extent: number
): Feature | null {
  const {geometry, properties, id} = feature;

  if (!geometry) {
    return null;
  }

  const geojsonGeometry = convertGeometryToGeoJSON(geometry, options, extent);
  if (!geojsonGeometry) {
    return null;
  }

  const featureProperties: {[key: string]: unknown} = {...properties};

  if (options.layerProperty) {
    featureProperties[options.layerProperty] = layerName;
  }

  const geojsonFeature: Feature = {
    type: 'Feature',
    geometry: geojsonGeometry as any,
    properties: featureProperties as any
  };

  if (id !== undefined && id !== null) {
    (geojsonFeature as any).id = id;
  }

  return geojsonFeature;
}

/**
 * Convert MLT geometry to GeoJSON geometry
 */
function convertGeometryToGeoJSON(
  geometry: MLTFeature['geometry'],
  options: MLTOptions,
  extent: number
): object | null {
  if (!geometry) {
    return null;
  }

  const {type, coordinates} = geometry;

  switch (type as number) {
    case GEOMETRY_TYPE.POINT: {
      // coordinates: [[Point]]
      const ring = coordinates?.[0];
      const point = ring?.[0];
      if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') {
        return null;
      }
      return {
        type: 'Point',
        coordinates: projectPoint(point.x, point.y, options, extent)
      };
    }
    case GEOMETRY_TYPE.MULTIPOINT: {
      // coordinates: [[p1], [p2], ...]
      return {
        type: 'MultiPoint',
        coordinates: coordinates.map(([p]) => projectPoint(p.x, p.y, options, extent))
      };
    }
    case GEOMETRY_TYPE.LINESTRING: {
      // coordinates: [[p1, p2, ...]]
      return {
        type: 'LineString',
        coordinates: coordinates[0].map(p => projectPoint(p.x, p.y, options, extent))
      };
    }
    case GEOMETRY_TYPE.MULTILINESTRING: {
      // coordinates: [[p1, p2, ...], [p1, p2, ...], ...]
      return {
        type: 'MultiLineString',
        coordinates: coordinates.map(ring => ring.map(p => projectPoint(p.x, p.y, options, extent)))
      };
    }
    case GEOMETRY_TYPE.POLYGON: {
      // coordinates: [[outer_ring_points], [hole_ring_points], ...]
      return {
        type: 'Polygon',
        coordinates: coordinates.map(ring => ring.map(p => projectPoint(p.x, p.y, options, extent)))
      };
    }
    case GEOMETRY_TYPE.MULTIPOLYGON: {
      // In MLT, multipolygon rings are flattened: [[ring1], [ring2], ...]
      // Treat each ring as its own polygon (simplified representation)
      return {
        type: 'MultiPolygon',
        coordinates: coordinates.map(ring => [
          ring.map(p => projectPoint(p.x, p.y, options, extent))
        ])
      };
    }
    default:
      return null;
  }
}

/**
 * Project a tile coordinate to either local (0-1) or WGS84 (lng/lat) coordinates
 */
function projectPoint(x: number, y: number, options: MLTOptions, extent: number): [number, number] {
  if (options.coordinates === 'wgs84' && options.tileIndex) {
    const {x: tx, y: ty, z} = options.tileIndex;
    const size = extent * Math.pow(2, z);
    const x0 = extent * tx;
    const y0 = extent * ty;
    const lng = ((x + x0) * 360) / size - 180;
    const y2 = 180 - ((y + y0) * 360) / size;
    const lat = (360 / Math.PI) * Math.atan(Math.exp((y2 * Math.PI) / 180)) - 90;
    return [lng, lat];
  }

  // Local coordinates: normalize to [0, 1]
  return [x / extent, y / extent];
}

/**
 * Validate loader options
 */
function checkOptions(options?: MLTLoaderOptions): MLTOptions {
  const mltOptions = {
    ...MLT_DEFAULT_OPTIONS,
    ...(options?.mlt ?? {}),
    geoarrow: options?.mlt?.geoarrow ?? options?.geoarrow
  } as MLTOptions;

  if (mltOptions.coordinates === 'wgs84' && !mltOptions.tileIndex) {
    throw new Error('MLT Loader: WGS84 coordinates require a tileIndex option');
  }

  return mltOptions;
}
