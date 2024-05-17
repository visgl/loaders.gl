// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {DataSourceProps} from './data-source';
import {DataSource} from './data-source';
// TODO - can we import from schema?
import {ImageType} from './utils/image-type';

export type ImageSourceProps = DataSourceProps;

/**
 * ImageSource - data sources that allow images to be queried by (geospatial) extents
 */
export abstract class ImageSource<
  PropsT extends ImageSourceProps = ImageSourceProps
> extends DataSource<PropsT> {
  static type: string = 'template';
  static testURL = (url: string): boolean => false;

  abstract getMetadata(): Promise<ImageSourceMetadata>;
  abstract getImage(parameters: GetImageParameters): Promise<ImageType>;
}

// PARAMETER TYPES

/**
 * Normalized capabilities of an Image service
 * @example
 *  The WMSSourceLoader will normalize the response to the WMS `GetCapabilities`
 *  data structure extracted from WMS XML response into an ImageSourceMetadata.
 */
export type ImageSourceMetadata = {
  name: string;
  title?: string;
  abstract?: string;
  keywords: string[];
  layers: ImageSourceLayer[];
};

/** Description of one data layer in the image source */
export type ImageSourceLayer = {
  /** Name of this layer */
  name?: string;
  /** Human readable title of this layer */
  title?: string;
  /** Coordinate systems supported by this layer */
  crs?: string[];
  /** layer limits in unspecified CRS:84-like lng/lat, for quick access w/o CRS calculations. */
  boundingBox?: [min: [x: number, y: number], max: [x: number, y: number]];
  /** Sub layers of this layer */
  layers?: ImageSourceLayer[];
};

/** Generic parameters for requesting an image from an image source */
export type GetImageParameters = {
  /** Layers to render */
  layers: string | string[];
  /** Styling */
  styles?: unknown;
  /** bounding box of the requested map image */
  boundingBox: [min: [x: number, y: number], max: [x: number, y: number]];
  /** @deprecated use boundingBox */
  bbox?: [number, number, number, number];
  /** pixel width of returned image */
  width: number;
  /** pixels */
  height: number;
  /** crs for the image (not the bounding box) */
  crs?: string;
  /** requested format for the return image */
  format?: 'image/png';
};
