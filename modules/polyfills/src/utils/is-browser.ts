// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable no-restricted-globals */
export const isBrowser: boolean =
  // @ts-ignore process.browser
  typeof process !== 'object' || String(process) !== '[object process]' || process.browser;
