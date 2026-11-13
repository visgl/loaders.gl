// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  isSourceLoader,
  resolveLoaderAuthenticationOptions,
  type DataSourceOptions
} from '@loaders.gl/core/loader-utils';
import type {QueryOptions} from './query';

/** Opens only explicit URL source loaders; the public query owns the returned source. */
export async function openQuerySource(options: QueryOptions): Promise<unknown> {
  const candidates = Array.isArray(options.loaders) ? options.loaders : [options.loaders];
  if (
    !candidates.length ||
    !candidates.every(isSourceLoader) ||
    candidates.some(loader => !loader.fromUrl)
  ) {
    throw new Error('Query source must specify explicit URL-capable source loaders for a URL.');
  }
  const {source, sources, loaders, sqlParser, onQueryComplete, queryOutput, ...sourceOptions} =
    options;
  const url = source as string;
  const selected =
    candidates.length === 1 ? candidates[0]! : candidates.find(loader => loader!.testURL(url));
  if (!selected) throw new Error('No explicit source loader matches the query URL.');
  const implementation = selected.preload ? await selected.preload(url, sourceOptions) : selected;
  options.signal?.throwIfAborted();
  if (!isSourceLoader(implementation) || !implementation.fromUrl)
    throw new Error('Query source preload did not return a URL-capable source loader.');
  const authenticatedOptions = await resolveLoaderAuthenticationOptions(
    selected.getAuthentications ? selected : implementation,
    url,
    {...sourceOptions, core: {...sourceOptions.core, ignoreRegisteredLoaders: true}}
  );
  options.signal?.throwIfAborted();
  return implementation.createDataSourceSync(url, authenticatedOptions as DataSourceOptions);
}
