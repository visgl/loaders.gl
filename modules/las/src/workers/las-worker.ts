// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createLoaderWorker} from '@loaders.gl/loader-utils';
import {LASLoaderWithParser} from '../las-loader';

createLoaderWorker(LASLoaderWithParser);
