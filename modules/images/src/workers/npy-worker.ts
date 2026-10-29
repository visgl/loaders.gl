// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {NPYLoaderWithParser} from '../npy-loader';
import {createLoaderWorker} from '@loaders.gl/core/loader-utils';

createLoaderWorker(NPYLoaderWithParser);
