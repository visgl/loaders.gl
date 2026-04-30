// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createLoaderWorker} from '@loaders.gl/loader-utils';
import {GeoJSONLoaderWithParser} from '../geojson-loader-with-parser';

createLoaderWorker(GeoJSONLoaderWithParser);
