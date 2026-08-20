// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createLoaderWorker} from '@loaders.gl/loader-utils';
import {PLYLoaderWithParser} from '../ply-loader-with-parser';

createLoaderWorker(PLYLoaderWithParser);
