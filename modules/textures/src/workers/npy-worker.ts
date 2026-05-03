// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {NPYLoaderWithParser} from '../npy-loader-with-parser';
import {createLoaderWorker} from '@loaders.gl/loader-utils';

createLoaderWorker(NPYLoaderWithParser);
