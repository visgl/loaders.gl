// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Source, SourceArrayOptionsType, SourceArrayDataSourceType} from '@loaders.gl/loader-utils';

/**
 * Creates a source from a service
 * If type is not supplied, will try to automatically detect the the
 * @param url URL to the data source
 * @param type type of source. if not known, set to 'auto'
 * @returns an DataSource instance
 */
// DataSourceOptionsT extends DataSourceOptions = DataSourceOptions,
// DataSourceT extends DataSource = DataSource
export function createDataSource<SourceArrayT extends Source[]>(
  data: string | Blob,
  sources: Readonly<SourceArrayT>,
  options: Readonly<SourceArrayOptionsType<SourceArrayT>>
): SourceArrayDataSourceType<SourceArrayT> {
  const type = options?.core?.type || (options.type as unknown as string) || 'auto';
  const source = type === 'auto' ? selectSource(data, sources) : getSourceOfType(type, sources);

  if (!source) {
    throw new Error('Not a valid source type');
  }
  return source.createDataSource(data, options);
}

// TODO - use selectSource...

/** Guess service type from URL */
function selectSource<SourceArrayT extends Source[]>(
  url: string | Blob,
  sources: Readonly<SourceArrayT>
): SourceArrayT[number] | null {
  for (const service of sources) {
    // @ts-expect-error
    if (service.testURL && service.testURL(url)) {
      return service;
    }
  }

  return null;
}

/** Guess service type from URL */
function getSourceOfType(type: string, sources: Readonly<Source[]>): Source | null {
  for (const service of sources) {
    if (service.type === type) {
      return service;
    }
  }
  return null;
}
