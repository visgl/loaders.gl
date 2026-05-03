// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createLoaderWorker} from '@loaders.gl/loader-utils';
import {LAZPerfLoaderWithParser} from '../lazperf-loader-with-parser';

createLoaderWorker(LAZPerfLoaderWithParser);
