// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createLoaderWorker} from '@loaders.gl/loader-utils';
import {GeoPackageLoaderWithParser} from '../geopackage-loader-with-parser';

createLoaderWorker(GeoPackageLoaderWithParser);
