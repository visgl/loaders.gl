// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createLoaderWorker} from '@loaders.gl/loader-utils';
import {CSVLoaderWithParser} from '../csv-loader-with-parser';

createLoaderWorker(CSVLoaderWithParser);
