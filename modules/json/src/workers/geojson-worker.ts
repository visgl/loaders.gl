// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createLoaderWorker} from '@loaders.gl/loader-utils';
import {GeoJSONLoader} from '../geojson-loader';

createLoaderWorker(GeoJSONLoader);
