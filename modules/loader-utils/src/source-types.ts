// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {DataSource, DataSourceProps} from './lib/sources/data-source';

/**
 * A `Source` contains metadata and a factory method for creating instances of a specific `DataSource`.
 * It allows a list of `Source` objects to be passed to methods
 * @example
 *  `createDataSource(... , [MVTSource, PMTilesSource, ...])
 */
export interface Source<
  DataSourceT extends DataSource = DataSource,
  DataSourcePropsT extends DataSourceProps = any
> {
  /** Type of source created by this service */
  source?: DataSourceT;
  /** Type of props used when creating sources */
  props?: DataSourcePropsT;

  /** Name of the service */
  name: string;
  id: string;
  /** Module containing the service */
  module: string;
  /** Version of the loaders.gl package containing this service. */
  version: string;
  /** URL extensions that this service uses */
  extensions: string[];
  /** MIME extensions that this service uses */
  mimeTypes: string[];
  /** Default options */
  options: DataSourcePropsT;

  /** Type string identifying this service, e.g. 'wms' */
  type: string;
  /** Can source be created from a URL */
  fromUrl: boolean;
  /** Can source be created from a Blob or File */
  fromBlob: boolean;

  /** Check if a URL can support this service */
  testURL: (url: string) => boolean;
  /** Test data */
  testData?: (data: Blob) => boolean;
  /** Create a source  */
  createDataSource(data: string | Blob, props: DataSourcePropsT): DataSourceT;
}
