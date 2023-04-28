// loaders.gl, MIT license

import type {ImageType} from '@loaders.gl/images';
import {DataSource, DataSourceProps} from './data-source';

/**
 * Normalized capabilities of an Image service
 * @example
 *  The WMSService will normalize the response to the WMS `GetCapabilities` data structure extracted from WMS XML response
 *  into an TileSourceMetadata.
 */
export type TileSourceMetadata = {
  name: string;
  title?: string;
  abstract?: string;
  keywords: string[];
  layer: {
    name: string;
    title?: string;
    srs?: string[];
    boundingBox?: [number, number, number, number];
    layers: TileSourceLayer[];
  };
};

export type TileSourceLayer = {
  name: string;
  title?: string;
  srs?: string[];
  boundingBox?: [number, number, number, number];
  layers: TileSourceLayer[];
};

export type GetTileParameters = {
  /** Layers to render */
  layers: string | string[];
  /** Styling */
  styles?: unknown;
  /** bounding box of the requested map image */
  zoom: number;
  /** tile x coordinate */
  x: number;
  /** tile y coordinate */
  y: number;
  /** srs for the image (not the bounding box) */
  srs?: string;
  /** requested format for the return image */
  format?: 'image/png';
};

type TileSourceProps = DataSourceProps;

/**
 * MapTileSource - data sources that allow data to be queried by (geospatial) extents
 * @note
 * - If geospatial, bounding box is expected to be in web mercator coordinates
 */
export abstract class TileSource<PropsT extends TileSourceProps> extends DataSource<PropsT> {
  abstract getMetadata(): Promise<TileSourceMetadata>;
  abstract getTile(parameters: GetTileParameters): Promise<ImageType>;
}
