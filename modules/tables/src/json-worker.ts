// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createLoaderWorker} from '@loaders.gl/core/loader-utils';
import {JSONLoaderWithParser} from './json/json-loader';
import {selectJSONWorkerLoader} from './json/lib/select-json-worker-loader';

createLoaderWorker(JSONLoaderWithParser, selectJSONWorkerLoader);
