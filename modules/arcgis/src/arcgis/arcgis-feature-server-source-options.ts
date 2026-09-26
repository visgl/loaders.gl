// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {DataSourceOptions} from '@loaders.gl/loader-utils';

/** Parameters for ArcGIS FeatureServer query requests. */
export type ArcGISFeatureServiceQueryOptions = {
  /** Include feature geometries in the response. */
  returnGeometry?: boolean;
  /** SQL where clause. */
  where?: string;
  /** Output spatial reference. */
  outSR?: string | number;
  /** Output fields. */
  outFields?: string | string[];
  /** Input spatial reference for supplied geometry. */
  inSR?: string | number;
  /** Filter geometry as an ArcGIS REST geometry string. */
  geometry?: string;
  /** Filter geometry type. */
  geometryType?:
    | 'esriGeometryEnvelope'
    | 'esriGeometryPoint'
    | 'esriGeometryPolyline'
    | 'esriGeometryPolygon';
  /** Spatial relationship for geometry filters. */
  spatialRel?:
    | 'esriSpatialRelIntersects'
    | 'esriSpatialRelContains'
    | 'esriSpatialRelCrosses'
    | 'esriSpatialRelEnvelopeIntersects'
    | 'esriSpatialRelIndexIntersects'
    | 'esriSpatialRelOverlaps'
    | 'esriSpatialRelTouches'
    | 'esriSpatialRelWithin';
  /** Geometry precision. */
  geometryPrecision?: number;
  /** Query result type. */
  resultType?: 'none' | 'standard' | 'tile';
  /** ArcGIS response format. */
  f?: 'geojson' | 'json' | 'pjson';
};

/** Options for the ArcGIS FeatureServer source. */
export type ArcGISFeatureServerSourceLoaderOptions = DataSourceOptions & {
  'arcgis-feature-server'?: {
    /** Default ArcGIS query request parameters. */
    queryParameters?: Partial<ArcGISFeatureServiceQueryOptions>;
  };
};

/** Default request options shared by metadata and runtime sources. */
export const ARCGIS_FEATURE_SERVER_SOURCE_DEFAULT_OPTIONS = {
  url: undefined!,
  'arcgis-feature-server': {}
};
