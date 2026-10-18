// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {setupTestEnvironment} from './vitest-setup-common';

await import('@loaders.gl/core/polyfills');
setupTestEnvironment({blockExternalNetwork: false});
