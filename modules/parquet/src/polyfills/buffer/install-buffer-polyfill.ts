// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {installBufferPolyfill} from './buffer-polyfill.node';

// @ts-ignore
globalThis.process = globalThis.process || {};
// @ts-ignore
globalThis.process.env = globalThis.process.env || {};

export const Buffer = installBufferPolyfill();
