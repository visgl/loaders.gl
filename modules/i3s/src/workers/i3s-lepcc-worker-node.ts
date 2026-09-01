// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import '@loaders.gl/polyfills';
import {createLoaderWorker} from '@loaders.gl/loader-utils';
import {I3SLEPCCLoaderWithParser} from '../i3s-lepcc-loader-with-parser';

createLoaderWorker(I3SLEPCCLoaderWithParser);
