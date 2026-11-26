// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createLoaderWorker} from '@loaders.gl/core/loader-utils';
import {CrunchLoader} from '../crunch/bundled-entry';

createLoaderWorker(CrunchLoader);
