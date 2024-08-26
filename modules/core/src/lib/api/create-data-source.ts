// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {DataSourceProps} from '@loaders.gl/loader-utils';
import {DataSource, Source} from '@loaders.gl/loader-utils';

/**
 * Creates a source from a service
 * If type is not supplied, will try to automatically detect the the
 * @param url URL to the data source
 * @param type type of source. if not known, set to 'auto'
 * @returns an DataSource instance
 */
export function createDataSource<
  DataSourcePropsT extends DataSourceProps = DataSourceProps,
  DataSourceT extends DataSource = DataSource
>(data: string | Blob, sources: Source[], props: DataSourcePropsT & {type?: string}): DataSourceT {
  const {type = 'auto'} = props;
  const source = type === 'auto' ? selectSource(data, sources) : getSourceOfType(type, sources);

  if (!source) {
    throw new Error('Not a valid image source type');
  }
  return source.createDataSource(data, props) as DataSourceT;
}

// TODO - use selectSource...

/** Guess service type from URL */
function selectSource(url: string | Blob, sources: Source[]): Source | null {
  for (const service of sources) {
    // @ts-expect-error
    if (service.testURL && service.testURL(url)) {
      return service;
    }
  }

  return null;
}

/** Guess service type from URL */
function getSourceOfType(type: string, sources: Source[]): Source | null {
  for (const service of sources) {
    if (service.type === type) {
      return service;
    }
  }
  return null;
}
