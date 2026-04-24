// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createLoaderWorker} from '@loaders.gl/loader-utils';
import {TerrainLoaderWithParser} from '../terrain-loader-with-parser';

createLoaderWorker(TerrainLoaderWithParser);
