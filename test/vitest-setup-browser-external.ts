// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {setupBrowserFileFetch} from './vitest-setup-browser-file-fetch';
import {setupTestEnvironment} from './vitest-setup-common';
import {setupLoaderTestEnvironment} from './vitest-setup-loaders';

setupTestEnvironment({blockExternalNetwork: false});
setupLoaderTestEnvironment();
setupBrowserFileFetch({rewriteRemoteFixtures: false});
