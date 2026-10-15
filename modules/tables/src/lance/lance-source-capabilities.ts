// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Features exposed by the current read-only Lance source implementation. */
export type LanceSourceCapabilities = Readonly<{
  /** Whether the source can cache decoded schema and dataset metadata. */
  supportsCachedMetadata: boolean;
  /** Whether the source can project selected columns. */
  supportsColumnProjection: boolean;
  /** Whether the source can emit Arrow record batches. */
  supportsArrowBatches: boolean;
  /** Whether the source can read multimodal blob columns lazily. */
  supportsLazyBlobs: boolean;
  /** Whether the source can push predicates into the Lance scanner. */
  supportsPredicatePushdown: boolean;
  /** Whether the source has a browser-compatible decoder backend. */
  supportsBrowserDecoder: boolean;
  /** Whether the source supports writes. */
  supportsWrite: boolean;
}>;

/** Current capabilities for the read-only Lance source MVP. */
export const LANCE_SOURCE_CAPABILITIES: LanceSourceCapabilities = Object.freeze({
  supportsCachedMetadata: true,
  supportsColumnProjection: false,
  supportsArrowBatches: true,
  supportsLazyBlobs: false,
  supportsPredicatePushdown: false,
  supportsBrowserDecoder: false,
  supportsWrite: false
});
