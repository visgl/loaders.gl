// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  convertFeatureCollectionToGeoArrowTable as convertFeatureCollectionToGeoArrowTableImplementation,
  convertFeaturesToGeoArrowTable as convertFeaturesToGeoArrowTableImplementation,
  convertTableToGeoArrow as convertTableToGeoArrowImplementation
} from './convert-table-to-geoarrow';
import {convertGeoArrowToBinaryFeatureCollection as convertGeoArrowToBinaryFeatureCollectionImplementation} from './lib/feature-collection-converters/convert-geoarrow-to-binary-features';
import {convertGeoArrowGeometryToGeoJSON as convertGeoArrowGeometryToGeoJSONImplementation} from './lib/geometry-converters/convert-geoarrow-to-geojson';
import {convertGeoArrowToTable as convertGeoArrowToTableImplementation} from './lib/table-converters/convert-geoarrow-table';
import {convertWKBTableToGeoJSON as convertWKBTableToGeoJSONImplementation} from './lib/table-converters/convert-wkb-table-to-geojson';

/**
 * @deprecated Use `convert(input, 'geojson-geometry', [GeometryConverter])`.
 */
export const convertGeoArrowGeometryToGeoJSON: typeof convertGeoArrowGeometryToGeoJSONImplementation =
  ((...args) =>
    convertGeoArrowGeometryToGeoJSONImplementation(
      ...(args as Parameters<typeof convertGeoArrowGeometryToGeoJSONImplementation>)
    )) as typeof convertGeoArrowGeometryToGeoJSONImplementation;

/**
 * @deprecated Use `convert(input, 'binary-feature-collection', [GeoArrowTableConverter, FeatureCollectionConverter])`.
 */
export const convertGeoArrowToBinaryFeatureCollection: typeof convertGeoArrowToBinaryFeatureCollectionImplementation =
  ((...args) =>
    convertGeoArrowToBinaryFeatureCollectionImplementation(
      ...(args as Parameters<typeof convertGeoArrowToBinaryFeatureCollectionImplementation>)
    )) as typeof convertGeoArrowToBinaryFeatureCollectionImplementation;

/**
 * @deprecated Use `convert(input, targetShape, [GeoArrowTableConverter])`.
 */
export const convertGeoArrowToTable: typeof convertGeoArrowToTableImplementation = ((...args) =>
  convertGeoArrowToTableImplementation(
    ...(args as Parameters<typeof convertGeoArrowToTableImplementation>)
  )) as typeof convertGeoArrowToTableImplementation;

/**
 * @deprecated Use `convert(input, 'geojson-table', [GeoArrowTableConverter])`.
 */
export const convertWKBTableToGeoJSON: typeof convertWKBTableToGeoJSONImplementation = ((...args) =>
  convertWKBTableToGeoJSONImplementation(
    ...(args as Parameters<typeof convertWKBTableToGeoJSONImplementation>)
  )) as typeof convertWKBTableToGeoJSONImplementation;

/**
 * @deprecated Use `convert(input, 'geoarrow', [GeoArrowTableConverter])`.
 */
export const convertTableToGeoArrow: typeof convertTableToGeoArrowImplementation = ((...args) =>
  convertTableToGeoArrowImplementation(
    ...(args as Parameters<typeof convertTableToGeoArrowImplementation>)
  )) as typeof convertTableToGeoArrowImplementation;

/**
 * @deprecated Use `convert(input, 'geoarrow', [FeatureCollectionConverter, GeoArrowTableConverter])`.
 */
export const convertFeatureCollectionToGeoArrowTable: typeof convertFeatureCollectionToGeoArrowTableImplementation =
  ((...args) =>
    convertFeatureCollectionToGeoArrowTableImplementation(
      ...(args as Parameters<typeof convertFeatureCollectionToGeoArrowTableImplementation>)
    )) as typeof convertFeatureCollectionToGeoArrowTableImplementation;

/**
 * @deprecated Use `convert(input, 'geoarrow', [FeatureCollectionConverter, GeoArrowTableConverter])`.
 */
export const convertFeaturesToGeoArrowTable: typeof convertFeaturesToGeoArrowTableImplementation =
  ((...args) =>
    convertFeaturesToGeoArrowTableImplementation(
      ...(args as Parameters<typeof convertFeaturesToGeoArrowTableImplementation>)
    )) as typeof convertFeaturesToGeoArrowTableImplementation;
