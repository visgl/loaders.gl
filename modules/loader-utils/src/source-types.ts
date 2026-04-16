// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from './loader-types';
import type {CoreAPI, DataSource, DataSourceOptions} from './lib/sources/data-source';

/**
 * A `SourceLoader` is a top-level loader that constructs a runtime `DataSource`.
 * It allows source-style loaders to participate in core loader selection and `load()`.
 * @example
 *  `createDataSource(... , [MVTSourceLoader, PMTilesSourceLoader, ...])
 */
export type SourceLoader<
  DataSourceT extends DataSource<unknown, DataSourceOptions> = DataSource<
    unknown,
    DataSourceOptions
  >,
  LoaderOptionsT extends LoaderOptions & DataSourceOptions = LoaderOptions & DataSourceOptions
> = Loader<DataSourceT, never, LoaderOptionsT> & {
  /** Type of source created by this source loader */
  dataSource?: DataSourceT;
  /** Type of options used when creating sources */
  options?: DataSourceT['optionsType'];

  /** Type string identifying this source loader, e.g. 'wms' */
  type: string;
  /** Can source be created from a URL */
  fromUrl: boolean;
  /** Can source be created from a Blob or File */
  fromBlob: boolean;

  /** Default options for creating the runtime data source */
  defaultOptions: Omit<
    Required<{[K in keyof DataSourceT['options']]: Required<DataSourceT['options'][K]>}>,
    'core'
  >;

  /** Check if a URL can support this source loader */
  testURL: (url: string) => boolean;
  /** Test data */
  testData?: (data: Blob) => boolean;
  /** Create a runtime data source  */
  createDataSource(
    data: string | Blob,
    options: Readonly<DataSourceT['optionsType']>,
    coreApi?: CoreAPI
  ): DataSourceT;
};

export function isSourceLoader(loader?: unknown): loader is SourceLoader {
  return Boolean(loader && typeof loader === 'object' && 'createDataSource' in loader);
}

/** Typescript helper to extract input data type from a source type */
export type SourcePropsType<SourceT extends SourceLoader> = Required<SourceT['options']>;

/** Typescript helper to extract the source options type from a source type */
export type SourceDataSourceType<SourceT extends SourceLoader> = SourceT['dataSource'];

/** Typescript helper to extract options type from an array of source types */
export type SourceArrayOptionsType<SourcesT extends SourceLoader[] = SourceLoader[]> =
  SourcesT[number]['options'] & DataSourceOptions;

/** Typescript helper to extract data type from a source type */
export type SourceArrayDataSourceType<SourcesT extends SourceLoader[] = SourceLoader[]> =
  SourcesT[number]['dataSource'];
/** Typescript helper to extract batch type from a source type */
