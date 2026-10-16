// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {isBrowser} from '@loaders.gl/loader-utils';

const SQL_JS_VERSION = '1.14.1';
/**
 * We pin to the same version as sql.js that we use.
 */
export const DEFAULT_SQLJS_CDN = isBrowser
  ? `https://cdn.jsdelivr.net/npm/sql.js@${SQL_JS_VERSION}/dist/`
  : null;
