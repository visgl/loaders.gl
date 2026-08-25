// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {LZ4Compression} from './lib/lz4-compression';

/**
 * LZ4 frame compression explicitly backed by lz4js.
 * @deprecated Prefer direction-specific implementations where bundle splitting is available.
 */
export class LZ4JSCompression extends LZ4Compression {}
