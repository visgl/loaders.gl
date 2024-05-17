// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Schema, GeoJSONTable} from '@loaders.gl/schema';
import type {
  VectorSourceProps,
  VectorSourceMetadata,
  GetFeaturesParameters,
  LoaderWithParser
} from '@loaders.gl/loader-utils';
import {Source, VectorSource} from '@loaders.gl/loader-utils';

import {FlatGeobufLoader} from './flatgeobuf-loader';

/**
 * @ndeprecated This is a WIP, not fully implemented
 * @see https://developers.arcgis.com/rest/services-reference/enterprise/feature-service.htm
 */
export const FlatGeobufSource = {
  name: 'FlatGeobuf',
  id: 'flatgeobuf-server',
  module: 'wms',
  version: '0.0.0',
  extensions: [],
  mimeTypes: [],
  options: {
    url: undefined!,
    'flatgeobuf-server': {
      /** Tabular loaders, normally the GeoJSONLoader */
      loaders: []
    }
  },

  type: 'flatgeobuf-server',
  fromUrl: true,
  fromBlob: false, // TODO check if supported by library?

  testURL: (url: string): boolean => url.toLowerCase().includes('FeatureServer'),
  createDataSource: (url, props: FlatGeobufVectorSourceProps): FlatGeobufVectorSource =>
    new FlatGeobufVectorSource(props)
} as const satisfies Source<FlatGeobufVectorSource, FlatGeobufVectorSourceProps>;

export type FlatGeobufVectorSourceProps = VectorSourceProps & {
  url: string;
  'flatgeobuf-server'?: {
    loaders: LoaderWithParser[];
  };
};

/**
 * ArcGIS ImageServer
 * Note - exports a big API, that could be exposed here if there is a use case
 * @see https://developers.arcgis.com/rest/services-reference/enterprise/feature-service.htm
 */
export class FlatGeobufVectorSource extends VectorSource<FlatGeobufVectorSourceProps> {
  data: string;
  url: string;
  protected formatSpecificMetadata: Promise<any> | null = null;

  constructor(props: FlatGeobufVectorSourceProps) {
    super(props);
    this.data = props.url;
    this.url = props.url;
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
    // const loader = this.props['flatgeobuf-server']?.loaders?.[0];
    // const table = loader?.parse(arrayBuffer);
    return table as GeoJSONTable;
  }
}
