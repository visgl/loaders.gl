// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createLoaderWorker} from '../lib/worker-loader-utils/create-loader-worker';
import {JSONLoader} from '../json-loader';

createLoaderWorker(JSONLoader);
