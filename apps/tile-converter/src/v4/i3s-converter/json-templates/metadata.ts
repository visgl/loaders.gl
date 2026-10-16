// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {BuilderInput} from '../../lib/utils/builder-input';

/** Serialized legacy archive metadata. */
export type ConversionMetadata = {
  /** Folder layout. */
  folderPattern: string;
  /** Archive compression. */
  archiveCompressionType: string;
  /** Resource compression. */
  resourceCompressionType: string;
  /** I3S version. */
  I3SVersion: string;
  /** Number of nodes. */
  nodeCount?: number;
};

/** Builds metadata with the legacy field selection and defaults. */
export function createMetadata(input: BuilderInput<ConversionMetadata> | null | undefined) {
  const source = input ?? {};
  return {
    folderPattern: source.folderPattern ?? 'BASIC',
    archiveCompressionType: source.archiveCompressionType ?? 'STORE',
    resourceCompressionType: source.resourceCompressionType ?? 'GZIP',
    I3SVersion: source.I3SVersion ?? '1.8',
    nodeCount: source.nodeCount ?? undefined
  };
}
