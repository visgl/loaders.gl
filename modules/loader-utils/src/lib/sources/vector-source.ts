// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Schema, GeoJSONTable, BinaryFeatureCollection} from '@loaders.gl/schema';
import type {DataSourceProps} from './data-source';
import {DataSource} from './data-source';

export type VectorSourceProps = DataSourceProps;

/**
 * VectorSource - data sources that allow features to be queried by (geospatial) extents
 * @note
 * - If geospatial, bounding box is expected to be in web mercator coordinates
 */
export abstract class VectorSource<
  PropsT extends VectorSourceProps = VectorSourceProps
> extends DataSource<PropsT> {
  static type: string = 'template';
  static testURL = (url: string): boolean => false;

  abstract getSchema(): Promise<Schema>;
  abstract getMetadata(options: {formatSpecificMetadata?: boolean}): Promise<VectorSourceMetadata>;
  abstract getFeatures(
    parameters: GetFeaturesParameters
  ): Promise<GeoJSONTable | BinaryFeatureCollection>;
}

// PARAMETER TYPES

/**
 * Normalized capabilities of an Image service
 * @example
 *  The WMSSourceLoader will normalize the response to the WMS `GetCapabilities`
 *  data structure extracted from WMS XML response into an VectorSourceMetadata.
 */
export type VectorSourceMetadata = {
  name: string;
  title?: string;
  abstract?: string;
  keywords: string[];
  layers: VectorSourceLayer[];
  /**
   * Attempts to preserve the original format specific metadata from the underlying source,
   * May be an approximate representation
   */
  formatSpecificMetadata?: Record<string, any>;
};

/** Description of one data layer in the image source */
export type VectorSourceLayer = {
  /** Name of this layer */
  name?: string;
  /** Human readable title of this layer */
  title?: string;
  /** Coordinate systems supported by this layer */
  crs?: string[];
  /** layer limits in unspecified CRS:84-like lng/lat, for quick access w/o CRS calculations. */
  boundingBox?: [min: [x: number, y: number], max: [x: number, y: number]];
  /** Sub layers of this layer */
  layers?: VectorSourceLayer[];
};

/** Generic parameters for requesting an image from an image source */
export type GetFeaturesParameters = {
  /** Layers to render */
  layers: string | string[];
  /** bounding box on the map (only return features within this bbox) */
  boundingBox: [min: [x: number, y: number], max: [x: number, y: number]];
  /** crs for the returned features (not the bounding box) */
  crs?: string;
  /** @deprecated requested format for the return image */
  format?: 'geojson' | 'binary';
};
