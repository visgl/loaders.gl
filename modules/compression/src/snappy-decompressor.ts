// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  SnappyJSDecompressor,
  type SnappyJSDecompressorOptions
} from './snappy-decompressor-snappyjs';

/** Balanced default Snappy decompressor using the compact snappyjs implementation. */
export class SnappyDecompressor extends SnappyJSDecompressor {}

export type {SnappyJSDecompressorOptions as SnappyDecompressorOptions};
