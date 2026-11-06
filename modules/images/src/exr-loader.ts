// SPDX-License-Identifier: MIT
import {EXRLoader} from './exr-loader-types';
import {parseEXR} from './exr/parse-exr';
const {preload: _preload, ...metadata} = EXRLoader;
/** Parser-bearing OpenEXR loader returning named channel planes. */
export const EXRLoaderWithParser = {...metadata, parse: parseEXR} as const;
