// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createLoaderWorker} from '@loaders.gl/loader-utils';
import {LERCLoaderWithParser} from '../lerc-loader-with-parser';

createLoaderWorker(LERCLoaderWithParser);
