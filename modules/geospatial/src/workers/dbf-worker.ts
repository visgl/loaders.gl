// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {DBFLoaderWithParser} from '../shapefile/dbf-loader';
import {createLoaderWorker} from '@loaders.gl/core/loader-utils';

createLoaderWorker(DBFLoaderWithParser);
