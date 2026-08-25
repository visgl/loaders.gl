// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {LZ4JSCompressor, type LZ4JSCompressorOptions} from './lz4-compressor-lz4js';

/** Balanced default LZ4 frame compressor using the compact lz4js implementation. */
export class LZ4Compressor extends LZ4JSCompressor {}

export type {LZ4JSCompressorOptions as LZ4CompressorOptions};
