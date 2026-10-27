// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {NPM_TAG} from '../npm-tag';

declare let __VERSION__: string;

/** Return this package's injected version, independent of other loaded versions. */
function getVersion(): string {
  const version = typeof __VERSION__ === 'undefined' ? NPM_TAG : __VERSION__;
  globalThis._loadersgl_ = globalThis._loadersgl_ || {};
  globalThis._loadersgl_.version ||= version;
  return version;
}

/** Version of this worker-utils build, or the branch's npm fallback tag. */
export const VERSION = getVersion();
