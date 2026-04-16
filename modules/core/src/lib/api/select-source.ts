// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {SourceLoader} from '@loaders.gl/loader-utils';
import {selectLoaderSync} from './select-loader';

/** Guess service type from URL */
export function selectSource(
  url: string | Blob,
  sources: SourceLoader[],
  options?: {
    /** Provide id of a source to select that source. Omit or provide 'auto' to test the source*/
    type?: string;
    nothrow?: boolean;
  }
): SourceLoader | null {
  const type = options?.type || 'auto';
  let selectedSource: SourceLoader | null = null;
  if (type === 'auto') {
    selectedSource = selectLoaderSync(url, sources, {core: {nothrow: true}}) as SourceLoader | null;
  } else {
    selectedSource = getSourceOfType(type, sources);
  }

  if (!selectedSource && !options?.nothrow) {
    throw new Error('Not a valid image source type');
  }

  return selectedSource;
}

/** Guess service type from URL */
function getSourceOfType(type: string, sources: SourceLoader[]): SourceLoader | null {
  for (const service of sources) {
    if (service.type === type) {
      return service;
    }
  }
  return null;
}
