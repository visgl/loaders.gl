// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type JSONPath from '../jsonpath/jsonpath';

/**
 * Options shared by streaming JSON parser backends.
 */
export type StreamingJSONParserOptions = {
  jsonpaths?: string[];
  metadata?: boolean;
};

/**
 * Interface implemented by streaming JSON parser backends.
 */
export interface StreamingJSONParserLike {
  write(chunk: string): unknown[];
  close(): void;
  getPartialResult(): unknown;
  getStreamingJsonPath(): JSONPath | null;
  getStreamingJsonPathAsString(): string | null;
}

/**
 * Factory type for streaming JSON parser backends.
 */
export type StreamingJSONParserFactory = (
  options?: StreamingJSONParserOptions
) => StreamingJSONParserLike;
