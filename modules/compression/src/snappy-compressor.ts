// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {SnappyJSCompressor, type SnappyJSCompressorOptions} from './snappy-compressor-snappyjs';

/** Balanced default Snappy compressor using the compact snappyjs implementation. */
export class SnappyCompressor extends SnappyJSCompressor {}

export type {SnappyJSCompressorOptions as SnappyCompressorOptions};
