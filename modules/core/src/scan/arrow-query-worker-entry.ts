// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {initializeTaskWorker} from '@math.gl/tasks';
import {createArrowQueryTask} from './arrow-query-worker.js';

void initializeTaskWorker(createArrowQueryTask());
