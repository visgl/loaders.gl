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
  defaultOptions: DataSourceT['optionsType'];

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

/** Extracts the full public options contract, including fields absent from runtime defaults. */
export type SourcePropsType<SourceT extends SourceLoader> = NonNullable<
  Parameters<SourceT['createDataSource']>[1]
>;

/** Typescript helper to extract the source options type from a source type */
export type SourceDataSourceType<SourceT extends SourceLoader> = ReturnType<
  SourceT['createDataSource']
>;

/** Combines options for all candidate sources instead of accepting one candidate's untyped keys. */
type UnionToIntersection<Value> = (Value extends unknown ? (value: Value) => void : never) extends (
  value: infer Intersection
) => void
  ? Intersection
  : never;

/** Typescript helper to extract options type from an array of source types */
export type SourceArrayOptionsType<SourcesT extends SourceLoader[] = SourceLoader[]> =
  UnionToIntersection<SourcePropsType<SourcesT[number]>> & DataSourceOptions;

/** Typescript helper to extract data type from a source type */
export type SourceArrayDataSourceType<SourcesT extends SourceLoader[] = SourceLoader[]> =
  SourceDataSourceType<SourcesT[number]>;
/** Typescript helper to extract batch type from a source type */
