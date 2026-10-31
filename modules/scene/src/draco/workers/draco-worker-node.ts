// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Polyfills increases the bundle size significantly. Use it for NodeJS worker only
import '@loaders.gl/core/polyfills';
import {createLoaderWorker} from '@loaders.gl/core/loader-utils';
import {DracoLoaderWithParser} from '../draco-loader';

createLoaderWorker(DracoLoaderWithParser);
