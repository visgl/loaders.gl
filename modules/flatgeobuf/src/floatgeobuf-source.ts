// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Schema, GeoJSONTable} from '@loaders.gl/schema';
import type {
  DataSourceOptions,
  VectorSourceMetadata,
  GetFeaturesParameters
} from '@loaders.gl/loader-utils';
import {Source, DataSource, VectorSource} from '@loaders.gl/loader-utils';

import {FlatGeobufLoader} from './flatgeobuf-loader';
import {FlatGeobufFormat} from './flatgeobuf-format';

export type FlatGeobuSourceOptions = DataSourceOptions & {
  flatgeobuf?: {};
};

/**
 * FlatGeobufSource
 * Incrementally load bounding boxes from a spatially indexed FlatGeobuf file
 * @ndeprecated This is a WIP, not fully implemented
 */
export const FlatGeobufSource = {
  ...FlatGeobufFormat,
  version: '0.0.0',
  type: 'flatgeobuf-server',
  fromUrl: true,
  fromBlob: false, // TODO check if supported by library?

  defaultOptions: {
    flatgeobuf: {}
  },

  testURL: (url: string): boolean => url.toLowerCase().includes('FeatureServer'),
  createDataSource: (url: string, options: FlatGeobuSourceOptions): FlatGeobufVectorSource =>
    new FlatGeobufVectorSource(url, options)
} as const satisfies Source<FlatGeobufVectorSource>;

/**
 * FlatGeobufVectorSource
 */
export class FlatGeobufVectorSource
  extends DataSource<string, FlatGeobuSourceOptions>
  implements VectorSource
{
  protected formatSpecificMetadata: Promise<any> | null = null;

  constructor(data: string, options: FlatGeobuSourceOptions) {
    super(data, options, FlatGeobufSource.defaultOptions);
    // this.formatSpecificMetadata = this._getFormatSpecificMetadata();
  }

  /** TODO - not yet clear if we can find schema information in the FeatureServer metadata or if we need to request a feature */
  async getSchema(): Promise<Schema> {
    await this.getMetadata({formatSpecificMetadata: true});
    return {metadata: {}, fields: []};
  }

  async getMetadata(options: {formatSpecificMetadata}): Promise<VectorSourceMetadata> {
    // Wait for raw metadata to load
    if (!this.formatSpecificMetadata) {
      // this.formatSpecificMetadata = await this._getFormatSpecificMetadata();
    }

    // const metadata = parseFlatGeobufMetadata(this.formatSpecificMetadata);

    // Only add the big blob of source metadata if explicitly requested
    if (options.formatSpecificMetadata) {
      // metadata.formatSpecificMetadata = this.formatSpecificMetadata;
    }
    // @ts-expect-error
    return {};
  }

  async getFeatures(parameters: GetFeaturesParameters): Promise<GeoJSONTable> {
    const response = await this.fetch(this.url);
    const arrayBuffer = await response.arrayBuffer();
    // TODO - hack - done to avoid pulling in selectLoader from core

    const table = await FlatGeobufLoader.parse(arrayBuffer, {});
    // const loader = this.options['flatgeobuf-server']?.loaders?.[0];
    // const table = loader?.parse(arrayBuffer);
    return table as GeoJSONTable;
  }
}
