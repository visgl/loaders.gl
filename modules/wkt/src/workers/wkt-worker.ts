// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createLoaderWorker} from '@loaders.gl/loader-utils';
import {WKTLoaderWithParser} from '../wkt-loader-with-parser';
import {WKBLoaderWithParser} from '../wkb-loader-with-parser';

createLoaderWorker(WKTLoaderWithParser, options =>
  options.wkb ? WKBLoaderWithParser : WKTLoaderWithParser
);
