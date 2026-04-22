// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {FeatureCollectionConverter} from './lib/feature-collection-converters/feature-collection-converter/feature-collection-converter';
import {GeometryConverter} from './lib/geometry-converters/geometry-converter/geometry-converter';

/**
 * Opt-in GIS converter bundle.
 */
export const GIS_CONVERTERS = [FeatureCollectionConverter, GeometryConverter] as const;
