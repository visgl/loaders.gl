// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createLoaderWorker} from '@loaders.gl/loader-utils';
import {PCDLoaderWithParser} from '../pcd-loader-with-parser';

createLoaderWorker(PCDLoaderWithParser);
