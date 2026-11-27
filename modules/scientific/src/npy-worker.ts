// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {NPYLoaderWithParser} from './npy-parser';
import {createLoaderWorker} from '@loaders.gl/core/loader-utils';

createLoaderWorker(NPYLoaderWithParser);
