// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// LERC - Limited Error Raster Compression
export const LERC_ERROR = 'lerc module is not esbuild compatible';
export type {LERCData} from './lib/parsers/lerc/lerc-types';
export {LERCFormat} from './lerc-format';
export {LERCLoader} from './lerc-loader';
