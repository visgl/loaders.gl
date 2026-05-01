// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createLoaderWorker} from '@loaders.gl/loader-utils';
import {FlatGeobufLoaderWithParser} from '../flatgeobuf-loader-with-parser';

createLoaderWorker(FlatGeobufLoaderWithParser);
