// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  convertFeatureCollectionToGeoArrowTable as convertGISFeatureCollectionToGeoArrowTable,
  convertFeaturesToGeoArrowTable as convertGISFeaturesToGeoArrowTable
} from '@loaders.gl/gis';
import type {ArrowTable, Feature, GeoJSONTable, Table} from '@loaders.gl/schema';
import {convertTableToArrow} from '@loaders.gl/schema-utils';
import type * as arrow from 'apache-arrow';
import type {GeoArrowEncoding} from './metadata/geoarrow-metadata';

/** Encodings accepted when converting feature geometry columns to GeoArrow output. */
export type GeoArrowConvertFromEncoding = 'wkb' | 'wkt' | 'geometry' | GeoArrowEncoding;

/** Options for converting loaders.gl tables to GeoArrow-compatible Arrow tables. */
export type GeoArrowConvertFromOptions = {
  /** Optional batch size forwarded to generic table-to-Arrow conversion. */
  batchSize?: number;
  /** GeoArrow-specific conversion options. */
  geoarrow?: {
    /** Geometry encoding to write for GeoJSON feature inputs. */
    encoding?: GeoArrowConvertFromEncoding;
  };
};

/**
 * Converts a loaders.gl table to an Apache Arrow table with GeoArrow-compatible geometry metadata when possible.
 *
 * Today this performs a geometry-aware conversion for `geojson-table` inputs and otherwise falls back to
 * generic Arrow conversion, preserving any existing schema metadata on the source table.
 */
export function convertTableToGeoArrow(
  table: Table,
  options?: GeoArrowConvertFromOptions
): arrow.Table {
  const encoding = normalizeGeoArrowEncoding(options?.geoarrow?.encoding);

  switch (table.shape) {
    case 'arrow-table':
      return table.data;

    case 'geojson-table':
      return convertFeatureCollectionToGeoArrowTable(table, {geoarrow: {encoding}}).data;

    default:
      return convertTableToArrow(table, options);
  }
}

/**
 * Converts a GeoJSON feature collection table to a loaders.gl Arrow table with WKB geometry metadata.
 */
export function convertFeatureCollectionToGeoArrowTable(
  table: GeoJSONTable,
  options?: GeoArrowConvertFromOptions
): ArrowTable {
  return convertGISFeatureCollectionToGeoArrowTable(table, {
    encoding: normalizeGeoArrowEncoding(options?.geoarrow?.encoding)
  });
}

/**
 * Converts GeoJSON features into a loaders.gl Arrow table with WKB geometry metadata.
 */
export function convertFeaturesToGeoArrowTable(
  features: Feature[],
  options?: GeoArrowConvertFromOptions
): ArrowTable {
  return convertGISFeaturesToGeoArrowTable(features, {
    encoding: normalizeGeoArrowEncoding(options?.geoarrow?.encoding)
  });
}

/** Normalizes public GeoArrow encoding names to implemented GIS helper encodings. */
function normalizeGeoArrowEncoding(
  encoding: GeoArrowConvertFromEncoding | undefined
): 'wkb' | 'wkt' {
  switch (encoding) {
    case undefined:
    case 'wkb':
    case 'geoarrow.wkb':
      return 'wkb';
    case 'wkt':
    case 'geoarrow.wkt':
      return 'wkt';
    case 'geometry':
    case 'geoarrow.point':
    case 'geoarrow.linestring':
    case 'geoarrow.polygon':
    case 'geoarrow.multipoint':
    case 'geoarrow.multilinestring':
    case 'geoarrow.multipolygon':
      throw new Error(
        `GeoArrow encoding "${encoding}" is not implemented for convertTableToGeoArrow`
      );
    default:
      throw new Error(`Unknown GeoArrow encoding "${encoding}"`);
  }
}
