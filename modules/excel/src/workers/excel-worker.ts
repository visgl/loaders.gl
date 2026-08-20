// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createLoaderWorker} from '@loaders.gl/loader-utils';
import {ExcelLoaderWithParser} from '../excel-loader-with-parser';

createLoaderWorker(ExcelLoaderWithParser);
