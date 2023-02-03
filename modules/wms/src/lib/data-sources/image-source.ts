// loaders.gl, MIT license

import {ImageType} from '@loaders.gl/images';

// ImageSource

/**
 * Normalized capabilities of an Image service
 * @example
 *  The WMSService will normalize the response to the WMS `GetCapabilities` data structure extracted from WMS XML response
 *  into an ImageSourceMetadata.
 */
export type ImageSourceMetadata = {
  name: string;
  title?: string;
  abstract?: string;
  keywords: string[];
  layer: {
    name: string;
    title?: string;
    srs?: string[];
    boundingBox?: [number, number, number, number];
    layers: ImageSourceLayer[];
  };
};

export type ImageSourceLayer = {
  name: string;
  title?: string;
  srs?: string[];
  boundingBox?: [number, number, number, number];
  layers: ImageSourceLayer[];
};

export type ImageSourceGetImageParameters = {
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
  /** srs for the image (not the bounding box) */
  srs?: string;
  /** requested format for the return image */
  format?: 'image/png';
};

/**
 * MapImageSource - data sources that allow data to be queried by (geospatial) extents
 * @note
 * - If geospatial, bounding box is expected to be in web mercator coordinates
 */
export abstract class ImageSource {
  abstract getMetadata(): Promise<ImageSourceMetadata>;
  abstract getImage(parameters: ImageSourceGetImageParameters): Promise<ImageType>;
}