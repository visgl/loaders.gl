// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {SHPColumnLoader} from '../shapefile/shp-loader';
import {createLoaderWorker} from '@loaders.gl/core/loader-utils';

createLoaderWorker(SHPColumnLoader);
