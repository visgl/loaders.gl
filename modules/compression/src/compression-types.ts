// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Compression, CompressionOptions} from './lib/compression';

/** Lightweight root-level metadata for a compression format. */
export type CompressionMetadata = {
  /** Stable format name. */
  readonly name: string;
  /** Common file extensions for the format. */
  readonly extensions: readonly string[];
  /** Content-encoding names for the format. */
  readonly contentEncodings: readonly string[];
  /** Whether a fallback implementation can be loaded for the format. */
  readonly isSupported: true;
  /** Loads and returns the concrete implementation selected for the options. */
  preload(options?: CompressionOptions & Record<string, any>): Promise<Compression>;
};
