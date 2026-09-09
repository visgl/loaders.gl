// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createLoaderWorker} from '@loaders.gl/loader-utils';
import {WKTLoader} from '../wkt-loader';
import {WKBLoader} from '../wkb-loader';

createLoaderWorker(WKTLoader, options => (options.wkb ? WKBLoader : WKTLoader));
