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

import {FlatgeobufLoader} from './flatgeobuf-loader';

const TEST_SERVICE =
  'https://services2.arcgis.com/CcI36Pduqd0OR4W9/ArcGIS/rest/services/Bicycle_Routes_Public/FeatureServer/0';
const TEST_QUERY =
  'query?returnGeometry=true&where=1%3D1&outSR=4326&outFields=*&inSR=4326&geometry=${-90}%2C+${30}%2C+${-70}%2C+${50}&geometryType=esriGeometryEnvelope&spatialRel=esriSpatialRelIntersects&geometryPrecision=6&resultType=tile&f=geojson';

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
  protected formatSpecificMetadata: Promise<any>;

  constructor(props: FlatGeobufVectorSourceProps) {
    super(props);
    this.data = props.url;
    this.formatSpecificMetadata = this._getFormatSpecificMetadata();
  }

  /** TODO - not yet clear if we can find schema information in the FeatureServer metadata or if we need to request a feature */
  async getSchema(): Promise<Schema> {
    await this.getMetadata({formatSpecificMetadata: true});
    return {metadata: {}, fields: []};
  }

  async getMetadata(options: {formatSpecificMetadata}): Promise<VectorSourceMetadata> {
    // Wait for raw metadata to load
    if (!this.formatSpecificMetadata) {
      this.formatSpecificMetadata = await this._getFormatSpecificMetadata();
    }

    const metadata = parseFlatGeobufMetadata(this.formatSpecificMetadata);

    // Only add the big blob of source metadata if explicitly requested
    if (options.formatSpecificMetadata) {
      metadata.formatSpecificMetadata = this.formatSpecificMetadata;
    }
    return metadata;
  }

  async getFeatures(parameters: GetFeaturesParameters): Promise<GeoJSONTable> {
    const url = `${TEST_SERVICE}/${TEST_QUERY}`;
    const response = await this.fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    // TODO - hack - done to avoid pulling in selectLoader from core
    const loader = this.props['flatgeobuf-server']?.loaders?.[0];
    const table = loader?.parse(arrayBuffer);
    return table;
  }
