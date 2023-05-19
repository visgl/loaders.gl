// loaders.gl, MIT license

import type {ImageType} from '@loaders.gl/images';
import type {DataSourceProps} from './data-source';
import {DataSource} from './data-source';

/**
 * Normalized capabilities of an Image service
 * @example
 *  The WMSService will normalize the response to the WMS `GetCapabilities`
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
  geographicBoundingBox?: [min: [x: number, y: number], max: [x: number, y: number]];
  /** Sub layers of this layer */
  layers?: ImageSourceLayer[];

  /** @deprecated from v3.4: non-vis.gl style bounding box. Use `.geographicBoundingBox` instead */
  boundingBox?: [number, number, number, number];
};

/** Generic parameters for requesting an image from an image source */
export type GetImageParameters = {
  /** Layers to render */
  layers: string | string[];
  /** Styling */
  styles?: unknown;
  /** bounding box of the requested map image */
  bbox: [number, number, number, number];
  /** pixel width of returned image */
  width: number;
  /** pixels */
  height: number;
  /** crs for the image (not the bounding box) */
  crs?: string;
  /** requested format for the return image */
  format?: 'image/png';
};

// Attempt to break down GetImageParameters
export type ImageFilters = {
  /** Layers to render */
  layers: string | string[];
  /** Styling */
  styles?: unknown;
};

export type ImageRegion = {
  /** bounding box of the requested map image */
  bbox: [number, number, number, number];
};

export type ImageFormat = {
  /** pixel width of returned image */
  width: number;
  /** pixels */
  height: number;
  /** crs for the image (not the bounding box) */
  crs?: string;
  /** requested format for the return image */
  format?: 'image/png';
};

export type ImageSourceProps = DataSourceProps;

/**
 * MapImageSource - data sources that allow data to be queried by (geospatial) extents
 * @note
 * - If geospatial, bounding box is expected to be in web mercator coordinates
 */
export abstract class ImageSource<
  PropsT extends ImageSourceProps = ImageSourceProps
> extends DataSource<PropsT> {
  abstract getMetadata(): Promise<ImageSourceMetadata>;
  abstract getImage(parameters: GetImageParameters): Promise<ImageType>;
}
