// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {SnappyCompression} from './lib/snappy-compression';

/**
 * Snappy compression explicitly backed by snappyjs.
 * @deprecated Prefer direction-specific implementations where bundle splitting is available.
 */
export class SnappyJSCompression extends SnappyCompression {}
