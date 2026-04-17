// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {convertBinaryFeatureCollectionToGeojson as convertBinaryFeatureCollectionToGeojsonImplementation} from './lib/feature-collection-converters/convert-binary-features-to-geojson';
import {convertFlatGeojsonToBinaryFeatureCollection as convertFlatGeojsonToBinaryFeatureCollectionImplementation} from './lib/feature-collection-converters/convert-flat-geojson-to-binary-features';
import {convertGeojsonToBinaryFeatureCollection as convertGeojsonToBinaryFeatureCollectionImplementation} from './lib/feature-collection-converters/convert-geojson-to-binary-features';
import {convertGeojsonToFlatGeojson as convertGeojsonToFlatGeojsonImplementation} from './lib/feature-collection-converters/convert-geojson-to-flat-geojson';
import {convertBinaryGeometryToGeometry as convertBinaryGeometryToGeometryImplementation} from './lib/geometry-converters/convert-binary-geometry-to-geojson';
import {convertGeometryToTWKB as convertGeometryToTWKBImplementation} from './lib/geometry-converters/wkb/convert-geometry-to-twkb';
import {convertGeometryToWKB as convertGeometryToWKBImplementation} from './lib/geometry-converters/wkb/convert-geometry-to-wkb';
import {convertGeometryToWKT as convertGeometryToWKTImplementation} from './lib/geometry-converters/wkb/convert-geometry-to-wkt';
import {convertTWKBToGeometry as convertTWKBToGeometryImplementation} from './lib/geometry-converters/wkb/convert-twkb-to-geometry';
import {convertWKBToBinaryGeometry as convertWKBToBinaryGeometryImplementation} from './lib/geometry-converters/wkb/convert-wkb-to-binary-geometry';
import {convertWKBToGeometry as convertWKBToGeometryImplementation} from './lib/geometry-converters/wkb/convert-wkb-to-geometry';
import {convertWKTToGeometry as convertWKTToGeometryImplementation} from './lib/geometry-converters/wkb/convert-wkt-to-geometry';

/**
 * @deprecated Use `convert(input, 'binary-feature-collection', [FeatureCollectionConverter])`.
 */
export const convertFlatGeojsonToBinaryFeatureCollection: typeof convertFlatGeojsonToBinaryFeatureCollectionImplementation =
  ((...args) =>
    convertFlatGeojsonToBinaryFeatureCollectionImplementation(
      ...(args as Parameters<typeof convertFlatGeojsonToBinaryFeatureCollectionImplementation>)
    )) as typeof convertFlatGeojsonToBinaryFeatureCollectionImplementation;

/**
 * @deprecated Use `convert(input, 'binary-feature-collection', [FeatureCollectionConverter])`.
 */
export const flatGeojsonToBinary = convertFlatGeojsonToBinaryFeatureCollection;

/**
 * @deprecated Use `convert(input, 'binary-feature-collection', [FeatureCollectionConverter])`.
 */
export const convertGeojsonToBinaryFeatureCollection: typeof convertGeojsonToBinaryFeatureCollectionImplementation =
  ((...args) =>
    convertGeojsonToBinaryFeatureCollectionImplementation(
      ...(args as Parameters<typeof convertGeojsonToBinaryFeatureCollectionImplementation>)
    )) as typeof convertGeojsonToBinaryFeatureCollectionImplementation;

/**
 * @deprecated Use `convert(input, 'binary-feature-collection', [FeatureCollectionConverter])`.
 */
export const geojsonToBinary = convertGeojsonToBinaryFeatureCollection;

/**
 * @deprecated Use `convert(input, 'flat-geojson', [FeatureCollectionConverter])`.
 */
export const convertGeojsonToFlatGeojson: typeof convertGeojsonToFlatGeojsonImplementation = ((
  ...args
) =>
  convertGeojsonToFlatGeojsonImplementation(
    ...(args as Parameters<typeof convertGeojsonToFlatGeojsonImplementation>)
  )) as typeof convertGeojsonToFlatGeojsonImplementation;

/**
 * @deprecated Use `convert(input, 'flat-geojson', [FeatureCollectionConverter])`.
 */
export const geojsonToFlatGeojson = convertGeojsonToFlatGeojson;

/**
 * @deprecated Use `convert(input, 'geojson', [FeatureCollectionConverter])`.
 */
export const convertBinaryFeatureCollectionToGeojson: typeof convertBinaryFeatureCollectionToGeojsonImplementation =
  ((...args) =>
    convertBinaryFeatureCollectionToGeojsonImplementation(
      ...(args as Parameters<typeof convertBinaryFeatureCollectionToGeojsonImplementation>)
    )) as typeof convertBinaryFeatureCollectionToGeojsonImplementation;

/**
 * @deprecated Use `convert(input, 'geojson', [FeatureCollectionConverter])`.
 */
export const binaryToGeojson = convertBinaryFeatureCollectionToGeojson;

/**
 * @deprecated Use `convert(input, 'geojson-geometry', [GeometryConverter])`.
 */
export const convertBinaryGeometryToGeometry: typeof convertBinaryGeometryToGeometryImplementation =
  ((...args) =>
    convertBinaryGeometryToGeometryImplementation(
      ...(args as Parameters<typeof convertBinaryGeometryToGeometryImplementation>)
    )) as typeof convertBinaryGeometryToGeometryImplementation;

/**
 * @deprecated Use `convert(input, 'geojson-geometry', [GeometryConverter])`.
 */
export const convertWKTToGeometry: typeof convertWKTToGeometryImplementation = ((...args) =>
  convertWKTToGeometryImplementation(
    ...(args as Parameters<typeof convertWKTToGeometryImplementation>)
  )) as typeof convertWKTToGeometryImplementation;

/**
 * @deprecated Use `convert(input, 'geojson-geometry', [GeometryConverter])`.
 */
export const convertWKBToGeometry: typeof convertWKBToGeometryImplementation = ((...args) =>
  convertWKBToGeometryImplementation(
    ...(args as Parameters<typeof convertWKBToGeometryImplementation>)
  )) as typeof convertWKBToGeometryImplementation;

/**
 * @deprecated Use `convert(input, 'geojson-geometry', [GeometryConverter])`.
 */
export const convertWKBToBinaryGeometry: typeof convertWKBToBinaryGeometryImplementation = ((
  ...args
) =>
  convertWKBToBinaryGeometryImplementation(
    ...(args as Parameters<typeof convertWKBToBinaryGeometryImplementation>)
  )) as typeof convertWKBToBinaryGeometryImplementation;

/**
 * @deprecated Use `convert(input, 'geojson-geometry', [GeometryConverter])`.
 */
export const convertTWKBToGeometry: typeof convertTWKBToGeometryImplementation = ((...args) =>
  convertTWKBToGeometryImplementation(
    ...(args as Parameters<typeof convertTWKBToGeometryImplementation>)
  )) as typeof convertTWKBToGeometryImplementation;

/**
 * @deprecated Use `convert(input, 'wkt', [GeometryConverter])`.
 */
export const convertGeometryToWKT: typeof convertGeometryToWKTImplementation = ((...args) =>
  convertGeometryToWKTImplementation(
    ...(args as Parameters<typeof convertGeometryToWKTImplementation>)
  )) as typeof convertGeometryToWKTImplementation;

/**
 * @deprecated Use `convert(input, 'wkb', [GeometryConverter])`.
 */
export const convertGeometryToWKB: typeof convertGeometryToWKBImplementation = ((...args) =>
  convertGeometryToWKBImplementation(
    ...(args as Parameters<typeof convertGeometryToWKBImplementation>)
  )) as typeof convertGeometryToWKBImplementation;

/**
 * @deprecated Use `convert(input, 'twkb', [GeometryConverter])`.
 */
export const convertGeometryToTWKB: typeof convertGeometryToTWKBImplementation = ((...args) =>
  convertGeometryToTWKBImplementation(
    ...(args as Parameters<typeof convertGeometryToTWKBImplementation>)
  )) as typeof convertGeometryToTWKBImplementation;
