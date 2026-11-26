// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {CrunchLoader as metadata} from '../crunch-loader';
import {parseCrunch} from '../lib/parsers/parse-crunch';

export type {CrunchLoaderOptions} from '../crunch-loader';
export {CrunchTextureFormat} from '../texture-format';

const {preload: _preload, ...descriptor} = metadata;

/** Eager Crunch decoder, also used by the standalone worker. */
export const CrunchLoader = {...descriptor, parse: parseCrunch};
