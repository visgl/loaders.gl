// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  SourceLoader,
  SourceArrayOptionsType,
  SourceArrayDataSourceType
} from '@loaders.gl/loader-utils';
import {resolveAuthenticationOptions} from '@loaders.gl/loader-utils';
import {coreApi} from './core-api';
import {selectLoaderSync} from './select-loader';

/**
 * Creates a source from a service
 * If type is not supplied, will try to automatically detect the the
 * @param url URL to the data source
 * @param type type of source. if not known, set to 'auto'
 * @returns an DataSource instance
 */
// DataSourceOptionsT extends DataSourceOptions = DataSourceOptions,
// DataSourceT extends DataSource = DataSource
export function createDataSource<SourceArrayT extends SourceLoader[]>(
  data: unknown,
  sources: Readonly<SourceArrayT>,
  options: Readonly<
    SourceArrayOptionsType<SourceArrayT>
  > = {} as SourceArrayOptionsType<SourceArrayT>
): SourceArrayDataSourceType<SourceArrayT> {
  const resolvedOptions = (options || {}) as SourceArrayOptionsType<SourceArrayT>;
  const type = resolvedOptions?.core?.type || (resolvedOptions.type as unknown as string) || 'auto';
  const source =
    sources.length === 1
      ? sources[0]
      : type === 'auto'
        ? (selectLoaderSync(data as never, sources as unknown as SourceLoader[], {
            // `createDataSource` supports non-fetch inputs such as in-memory tables.
            // Selection remains best-effort for those cases.
            ...resolvedOptions,
            core: {...resolvedOptions?.core, type: 'auto'}
          }) as SourceArrayT[number] | null)
        : getSourceOfType(type, sources);

  if (!source) {
    throw new Error('Not a valid source type');
  }
  const contributions = resolvedOptions.core?.credentials?.length
    ? source.getAuthentications?.(typeof data === 'string' ? data : '', resolvedOptions)
    : undefined;
  if (contributions && 'then' in contributions) {
    // Avoid an unhandled rejection from a hook that cannot be awaited by this sync API.
    void contributions.catch(() => {});
    throw new Error('Use load() with an asynchronous getAuthentications() hook.');
  }
  const authenticatedOptions = resolveAuthenticationOptions(
    contributions?.length
      ? {
          ...resolvedOptions,
          core: {
            ...resolvedOptions.core,
            authentications: [
              ...(resolvedOptions.core?.authentications || []),
              ...(contributions || [])
            ]
          }
        }
      : resolvedOptions
  );
  return source.createDataSource(
    data as string | Blob,
    authenticatedOptions,
    coreApi
  ) as SourceArrayDataSourceType<SourceArrayT>;
}

/** Guess service type from URL */
function getSourceOfType(type: string, sources: Readonly<SourceLoader[]>): SourceLoader | null {
  for (const service of sources) {
    if (service.type === type) {
      return service;
    }
  }
  return null;
}
