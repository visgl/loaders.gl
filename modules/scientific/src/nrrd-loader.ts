// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {NRRDLoader} from './nrrd-loader-types';
import {parseNRRD} from './nrrd/parse-nrrd';
const {preload: _preload, ...metadata} = NRRDLoader;
/** Parser-bearing attached NRRD array loader. */
export const NRRDLoaderWithParser = {...metadata, parse: parseNRRD} as const;
