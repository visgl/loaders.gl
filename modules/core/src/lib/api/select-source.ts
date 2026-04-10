// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Source} from '@loaders.gl/loader-utils';

/** Guess service type from URL */
export function selectSource(
  url: string | Blob,
  sources: Source[],
  options?: {
    /** Provide id of a source to select that source. Omit or provide 'auto' to test the source*/
    type?: string;
    nothrow?: boolean;
  }
): Source | null {
  const type = options?.type || 'auto';
  let selectedSource: Source | null = null;
  if (type === 'auto') {
    for (const source of sources) {
      if (typeof url === 'string' && source.testURL && source.testURL(url)) {
        return source;
      }
    }
  } else {
    selectedSource = getSourceOfType(type, sources);
  }

  if (!selectedSource && !options?.nothrow) {
    throw new Error('Not a valid image source type');
  }

  return selectedSource;
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
