// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {DataSource, DataSourceOptions} from './lib/sources/data-source';

/**
 * A `Source` contains metadata and a factory method for creating instances of a specific `DataSource`.
 * It allows a list of `Source` objects to be passed to methods
 * @example
 *  `createDataSource(... , [MVTSource, PMTilesSource, ...])
 */
export interface Source<
  DataSourceT extends DataSource<unknown, DataSourceOptions> = DataSource<
    unknown,
    DataSourceOptions
  >
> {
  /** Type of source created by this service */
  dataSource?: DataSourceT;
  /** Type of options used when creating sources */
  options?: DataSourceT['optionsType'];

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

  /** Type string identifying this service, e.g. 'wms' */
  type: string;
  /** Can source be created from a URL */
  fromUrl: boolean;
  /** Can source be created from a Blob or File */
  fromBlob: boolean;

  /** Default options */
  defaultOptions: Omit<
    Required<{[K in keyof DataSourceT['options']]: Required<DataSourceT['options'][K]>}>,
    'core'
  >;

  /** Check if a URL can support this service */
  testURL: (url: string) => boolean;
  /** Test data */
  testData?: (data: Blob) => boolean;
  /** Create a source  */
  createDataSource(data: string | Blob, options: Readonly<DataSourceT['optionsType']>): DataSourceT;
}

// T extends Source<DataSource, any> ? DataSource : never;
// T extends Source<any, infer PropsType> ? PropsType : never;

/** Typescript helper to extract input data type from a source type */
export type SourcePropsType<SourceT extends Source> = Required<SourceT['options']>;

/** Typescript helper to extract the source options type from a source type */
export type SourceDataSourceType<SourceT extends Source> = SourceT['dataSource'];

/** Typescript helper to extract options type from an array of source types */
export type SourceArrayOptionsType<SourcesT extends Source[] = Source[]> =
  SourcesT[number]['options'] & DataSourceOptions;

/** Typescript helper to extract data type from a source type */
export type SourceArrayDataSourceType<SourcesT extends Source[] = Source[]> =
  SourcesT[number]['dataSource'];
/** Typescript helper to extract batch type from a source type */
