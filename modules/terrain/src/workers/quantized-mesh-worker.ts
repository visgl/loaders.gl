// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createLoaderWorker} from '@loaders.gl/loader-utils';
import {QuantizedMeshLoaderWithParser} from '../quantized-mesh-loader-with-parser';

createLoaderWorker(QuantizedMeshLoaderWithParser);
