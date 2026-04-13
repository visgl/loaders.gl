// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CoreAPI} from '@loaders.gl/loader-utils';
import {fetchFile} from '../fetch/fetch-file';
import {parse} from './parse';
import {parseSync} from './parse-sync';
import {parseInBatches} from './parse-in-batches';
import {load} from './load';
import {loadInBatches} from './load-in-batches';

/**
 * Shared Core API surface that can be injected into contexts and sources.
 */
export const coreApi: CoreAPI = Object.freeze({
  fetchFile,
  parse,
  parseSync,
  parseInBatches,
  load,
  loadInBatches
});
