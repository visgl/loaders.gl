// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import '@loaders.gl/core/polyfills';
import {createLoaderWorker} from '@loaders.gl/core/loader-utils';
import {MVTLoaderWithParser} from '../mvt-loader-with-parser';

createLoaderWorker(MVTLoaderWithParser);
