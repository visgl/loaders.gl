// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createLoaderWorker} from '@loaders.gl/loader-utils';
import {I3SContentLoaderWithParser} from '../i3s-content-loader-with-parser';

createLoaderWorker(I3SContentLoaderWithParser);
