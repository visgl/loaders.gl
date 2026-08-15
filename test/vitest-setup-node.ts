// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {setupTestEnvironment} from './vitest-setup-common';
import {setupLoaderTestEnvironment} from './vitest-setup-loaders';

setupTestEnvironment({blockExternalNetwork: true});
setupLoaderTestEnvironment();
