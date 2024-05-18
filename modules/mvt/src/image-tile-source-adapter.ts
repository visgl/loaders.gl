// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ImageType, DataSourceProps} from '@loaders.gl/loader-utils';
import type {ImageTileSource, ImageSource} from '@loaders.gl/loader-utils';
import type {GetTileParameters} from '@loaders.gl/loader-utils';
import {DataSource} from '@loaders.gl/loader-utils';
import {ImageLoaderOptions} from '@loaders.gl/images';
import {TileJSONLoaderOptions} from '@loaders.gl/mvt';
import {getTileBoundingBox} from './lib/utils/geometry-utils';

/** Properties for ImageSource->ImageTileSource adapter */
export type ImageTileSourceAdapterProps = DataSourceProps & {
  /** Root url of tileset */
  url: string;
  /** if not supplied, loads tilejson.json, If null does not load metadata */
  metadataUrl?: string | null;
  /** Override extension (necessary if no metadata) */
  extension?: string;
  /** Additional attribution, adds to any attribution loaded from tileset metadata */
  attributions?: string[];
  /** Specify load options for all sub loaders */
  loadOptions?: TileJSONLoaderOptions & ImageLoaderOptions;
};

/**
 * Adapts an ImageSource to an ImageTileSource.
 * @deprecated This is still an incomplete work in progress.
 */
export class ImageTileSourceAdapter extends DataSource implements ImageTileSource {
  readonly props: ImageTileSourceAdapterProps;
  readonly url: string;
  readonly metadataUrl: string | null = null;
  data: string;
  schema: 'tms' | 'xyz' | 'template' = 'tms';
  extension: string;
  mimeType: string | null = null;

  tileSize: number = 256;

  readonly imageSource: ImageSource;

  constructor(imageSource: ImageSource, props: ImageTileSourceAdapterProps) {
    super(props);
    this.props = props;
    // @ts-expect-error
    this.url = imageSource.url;
    this.extension = props.extension || '.png';
    this.data = this.url;

    this.imageSource = imageSource;

    this.getImageTile = this.getImageTile.bind(this);
  }

  // @ts-ignore - Metadata type misalignment
  getMetadata(): Promise<unknown | null> {
    return this.imageSource.getMetadata();
  }

  getTileMIMEType(): string | null {
    return this.mimeType;
  }

  // async getTileData(parameters: GetTileDataParameters): Promise<unknown> {
  //   return this.getImageTile(parameters);
  // }

  async getImageTile(tileParams: GetTileParameters): Promise<ImageType | null> {
    const {x, y, z} = tileParams;
    const boundingBox = getTileBoundingBox({x, y, z});
    return await this.imageSource.getImage({
      boundingBox,
      layers: tileParams.layers || [],
      width: this.tileSize,
      height: this.tileSize
    });
  }
}
