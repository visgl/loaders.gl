// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createLoaderWorker} from '@loaders.gl/core/loader-utils';
import {WKTLoaderWithParser} from '../wkt-loader';
import {WKBLoaderWithParser} from '../wkb-loader';

createLoaderWorker(WKTLoaderWithParser, options =>
  options._workerLoaderId === 'wkb' ? WKBLoaderWithParser : WKTLoaderWithParser
);
