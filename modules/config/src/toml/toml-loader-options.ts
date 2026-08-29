// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderOptions} from '@loaders.gl/loader-utils';

/** Options accepted by the underlying TOML parser. */
export type TOMLParseOptions = {
  /** Maximum nesting depth accepted by the parser. */
  maxDepth?: number;
  /** Whether integers should be returned as BigInt values. */
  integersAsBigInt?: boolean | 'asNeeded';
};

/** Options for parsing TOML documents. */
export type TOMLLoaderOptions = LoaderOptions & {
  /** TOML parser options. */
  toml?: TOMLParseOptions;
};
