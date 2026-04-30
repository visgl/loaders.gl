// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {DBFLoaderWithParser} from '../dbf-loader-with-parser';
import {createLoaderWorker} from '@loaders.gl/loader-utils';

createLoaderWorker(DBFLoaderWithParser);
