// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {ArrowTable, Geometry} from '@loaders.gl/schema';
import {getGeoMetadata} from '@loaders.gl/schema';
import {convertWKBToGeometry} from '@loaders.gl/arrow-geometry/geometry-codecs';
import {fromVectorTileJs} from './mapbox-vt-pbf/to-vector-tile';
import type {MVTTile} from './mvt-pbf/mvt-types';
import type {MVTWriterOptions} from './encode-mvt';
import {isLongitudeLatitudeCRS} from './is-longitude-latitude-crs';

/** One quantized tile coordinate consumed by the existing protobuf serializer. */
interface TilePoint {
  /** Horizontal extent-unit coordinate. */
  readonly x: number;
  /** Vertical extent-unit coordinate. */
  readonly y: number;
}

/** Geometry ownership and source row retained without copying attribute rows. */
interface ArrowMVTFeature {
  /** Source row to read when serializing attributes. */
  readonly row: number;
  /** MVT point, line or polygon enum value. */
  readonly type: number;
  /** Quantized paths or polygon rings. */
  readonly geometry: TilePoint[][];
  /** Optional exact, nonnegative feature identifier. */
  readonly id?: number;
}

/** Encodes a GeoArrow WKB tile, reading attribute columns directly at the protobuf boundary. */
export function encodeMVTArrow(
  input: ArrowTable | arrow.Table,
  options: MVTWriterOptions
): ArrayBuffer {
  const table = input instanceof arrow.Table ? input : input.data;
  const configuration = options.mvt ?? {};
  const extent = configuration.extent ?? 4096;
  const version = configuration.version ?? 2;
  const coordinates = configuration.coordinates ?? 'local';
  if (!Number.isInteger(extent) || extent < 1 || extent > 65536 || ![1, 2].includes(version))
    throw new Error('Invalid Arrow MVT extent or version');
  if (!['local', 'tile', 'wgs84'].includes(coordinates))
    throw new Error('Invalid Arrow MVT coordinates');
  const tileIndex = configuration.tileIndex;
  if (
    coordinates === 'wgs84' &&
    (!tileIndex ||
      !Number.isInteger(tileIndex.z) ||
      tileIndex.z < 0 ||
      tileIndex.z > 26 ||
      !Number.isInteger(tileIndex.x) ||
      !Number.isInteger(tileIndex.y) ||
      tileIndex.x < 0 ||
      tileIndex.y < 0 ||
      tileIndex.x >= 2 ** tileIndex.z ||
      tileIndex.y >= 2 ** tileIndex.z)
  )
    throw new Error('Arrow MVT wgs84 coordinates require a valid tileIndex');
  const maximum = configuration.maxFeatures ?? 100000;
  if (!Number.isSafeInteger(maximum) || maximum < 1 || table.numRows > maximum)
    throw new Error('Arrow MVT feature limit exceeded or invalid');
  const geoMetadata = getGeoMetadata(table.schema.metadata);
  const geometryName = configuration.geometryColumn ?? geoMetadata?.primary_column;
  const candidates = table.schema.fields.filter(field =>
    geometryName
      ? field.name === geometryName
      : field.metadata.get('ARROW:extension:name') === 'geoarrow.wkb'
  );
  if (candidates.length !== 1)
    throw new Error('Select one GeoArrow WKB column with mvt.geometryColumn');
  const geometryField = candidates[0];
  if (
    geometryField.metadata.get('ARROW:extension:name') !== 'geoarrow.wkb' &&
    geoMetadata?.columns[geometryField.name]?.encoding !== 'wkb'
  )
    throw new Error(
      'Arrow MVT requires GeoArrow WKB geometry; tile native input with the Arrow tiler first'
    );
  const extensionMetadata = JSON.parse(
    geometryField.metadata.get('ARROW:extension:metadata') || '{}'
  );
  const columnMetadata = geoMetadata?.columns[geometryField.name];
  const coordinateSystem =
    extensionMetadata.crs ??
    columnMetadata?.crs ??
    (columnMetadata && !Object.hasOwn(columnMetadata, 'crs') ? 'OGC:CRS84' : null);
  if (coordinateSystem != null && !isLongitudeLatitudeCRS(coordinateSystem))
    throw new Error('Reproject Arrow geometry before MVT encoding');
  if (coordinateSystem != null && coordinates !== 'wgs84')
    throw new Error(
      'Declared geographic CRS requires mvt.coordinates wgs84; use the Arrow tiler for local tiles'
    );
  const geometryColumn = table.getChild(geometryField.name)!;
  const propertyNames =
    configuration.propertyColumns ??
    table.schema.fields
      .filter(
        field =>
          field.name !== geometryField.name &&
          !field.metadata.get('ARROW:extension:name')?.startsWith('geoarrow.') &&
          !geoMetadata?.columns[field.name]
      )
      .map(field => field.name);
  if (new Set(propertyNames).size !== propertyNames.length)
    throw new Error('Duplicate MVT property column');
  const properties = propertyNames.map(name => {
    const column = table.getChild(name);
    if (!column || name === geometryField.name || !isPropertyType(column.type))
      throw new Error(`Unsupported MVT property column: ${name}`);
    return {name, column};
  });
  const identifier = configuration.idColumn ? table.getChild(configuration.idColumn) : null;
  if (configuration.idColumn && !identifier) throw new Error('Unknown MVT idColumn');
  const features: ArrowMVTFeature[] = [];
  for (let row = 0; row < table.numRows; row++) {
    if (!geometryColumn.isValid(row)) continue;
    const geometry = convertWKBToGeometry(geometryColumn.get(row));
    const rings = projectGeometry(geometry, projectPoint);
    if (!rings.length) continue;
    const id = identifier?.get(row);
    const numericId = id == null ? undefined : getScalar(id);
    if (
      numericId !== undefined &&
      (typeof numericId !== 'number' || !Number.isSafeInteger(numericId) || numericId < 0)
    )
      throw new Error('MVT feature IDs must be nonnegative safe integers');
    features.push({
      row,
      id: numericId as number | undefined,
      type: geometry.type.includes('Point') ? 1 : geometry.type.includes('LineString') ? 2 : 3,
      geometry: rings
    });
  }
  if (!features.length) return new ArrayBuffer(0);
  const layer = {
    name: configuration.layerName ?? 'geojsonLayer',
    version,
    extent,
    length: features.length,
    /** Supplies one geometry and lazily read property entries without materializing GeoJSON features. */
    feature(index: number) {
      const feature = features[index];
      return {
        id: feature.id,
        type: feature.type,
        loadGeometry: () => feature.geometry,
        /** Omits null tags, preserving supported Arrow scalar values. */
        *propertyEntries(): Iterable<[string, string | number | boolean]> {
          for (const {name, column} of properties) {
            const value = column.get(feature.row);
            if (value != null) yield [name, getScalar(value)];
          }
        }
      };
    }
  };
  if (!layer.name) throw new Error('MVT layerName must be nonempty');
  return fromVectorTileJs({layers: {[layer.name]: layer}} as unknown as MVTTile);

  /** Quantizes explicitly declared coordinate space, including the tiler's clipping buffer. */
  function projectPoint(point: number[]): TilePoint {
    if (point.length !== 2 || !point.every(Number.isFinite))
      throw new Error('Arrow MVT requires finite XY coordinates');
    let [x, y] = point;
    if (coordinates === 'local') {
      x *= extent;
      y *= extent;
    }
    if (coordinates === 'wgs84') {
      if (Math.abs(x) > 180 || Math.abs(y) > 90) throw new Error('Invalid MVT longitude/latitude');
      const latitude = (Math.max(-85.0511287798066, Math.min(85.0511287798066, y)) * Math.PI) / 180;
      const size = extent * 2 ** tileIndex!.z;
      x = ((x + 180) / 360) * size - extent * tileIndex!.x;
      y =
        ((1 - Math.log(Math.tan(Math.PI / 4 + latitude / 2)) / Math.PI) / 2) * size -
        extent * tileIndex!.y;
    }
    x = Math.round(x);
    y = Math.round(y);
    if (Math.abs(x) > 1073741823 || Math.abs(y) > 1073741823)
      throw new Error('MVT quantized coordinate limit exceeded');
    return {x, y};
  }
}

/** Recognizes scalar logical Arrow types; dictionary storage retains its decoded scalar type. */
function isPropertyType(type: arrow.DataType): boolean {
  if (arrow.DataType.isDictionary(type)) return isPropertyType(type.dictionary);
  return [
    arrow.Type.Null,
    arrow.Type.Bool,
    arrow.Type.Int,
    arrow.Type.Float,
    arrow.Type.Utf8
  ].includes(type.typeId);
}

/** Rejects unsupported values and integer precision loss rather than stringifying attributes. */
function getScalar(value: unknown): string | number | boolean {
  if (typeof value === 'bigint') {
    if (value < BigInt(Number.MIN_SAFE_INTEGER) || value > BigInt(Number.MAX_SAFE_INTEGER))
      throw new Error('MVT integer exceeds the supported safe integer range');
    return Number(value);
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || (Number.isInteger(value) && !Number.isSafeInteger(value)))
      throw new Error('Invalid or unsafe MVT number');
    return value;
  }
  if (typeof value === 'string' || typeof value === 'boolean') return value;
  throw new Error('Unsupported MVT scalar value');
}

/** Quantizes geometry, drops collapsed paths and enforces MVT v2 polygon ring orientation. */
function projectGeometry(
  geometry: Geometry,
  project: (point: number[]) => {x: number; y: number}
): TilePoint[][] {
  /** Removes consecutive repeated vertices after quantization. */
  const projectLine = (line: number[][]) =>
    line
      .map(project)
      .filter(
        (point, index, points) =>
          !index || point.x !== points[index - 1].x || point.y !== points[index - 1].y
      );
  /** Keeps the exterior and nondegenerate holes, closing and orienting each ring. */
  const projectPolygon = (polygon: number[][][]) => {
    const rings: {x: number; y: number}[][] = [];
    for (let index = 0; index < polygon.length; index++) {
      const ring = projectLine(polygon[index]);
      if (
        ring.length &&
        (ring[0].x !== ring[ring.length - 1].x || ring[0].y !== ring[ring.length - 1].y)
      )
        ring.push({...ring[0]});
      let area = 0;
      for (let vertex = 1; vertex < ring.length; vertex++)
        area +=
          (ring[vertex - 1].x - ring[0].x) * (ring[vertex].y - ring[0].y) -
          (ring[vertex].x - ring[0].x) * (ring[vertex - 1].y - ring[0].y);
      if (ring.length < 4 || !area) {
        if (!index) return [];
        continue;
      }
      if (area > 0 !== (index === 0)) ring.reverse();
      rings.push(ring);
    }
    return rings;
  };
  switch (geometry.type) {
    case 'Point':
      return geometry.coordinates.length ? [[project(geometry.coordinates)]] : [];
    case 'MultiPoint':
      return geometry.coordinates.length ? [geometry.coordinates.map(project)] : [];
    case 'LineString': {
      const line = projectLine(geometry.coordinates);
      return line.length > 1 ? [line] : [];
    }
    case 'MultiLineString':
      return geometry.coordinates.map(projectLine).filter(line => line.length > 1);
    case 'Polygon':
      return projectPolygon(geometry.coordinates);
    case 'MultiPolygon':
      return geometry.coordinates.flatMap(projectPolygon);
    default:
      throw new Error(`Unsupported Arrow MVT geometry: ${geometry.type}`);
  }
}
