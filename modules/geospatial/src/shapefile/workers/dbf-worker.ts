// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {DBFLoaderWithParser} from '../dbf-loader';
import {createLoaderWorker} from '@loaders.gl/loader-utils';

createLoaderWorker(DBFLoaderWithParser);
