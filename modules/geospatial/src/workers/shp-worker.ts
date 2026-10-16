// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {SHPLoaderWithParser} from '../shapefile/shp-loader';
import {createLoaderWorker} from '@loaders.gl/loader-utils';

createLoaderWorker(SHPLoaderWithParser);
