// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderOptions} from '@loaders.gl/loader-utils';

/** Options accepted by the underlying YAML parser. */
export type YAMLParseOptions = {
  /** YAML language version used for resolving scalar values. */
  version?: '1.1' | '1.2' | 'next';
  /** Parse integers as BigInt values. */
  intAsBigInt?: boolean;
  /** Reject non-string mapping keys. */
  stringKeys?: boolean;
  /** Reject duplicate mapping keys. */
  uniqueKeys?: boolean;
};

/** Options for parsing YAML documents. */
export type YAMLLoaderOptions = LoaderOptions & {
  /** YAML parser options. */
  yaml?: YAMLParseOptions;
};
