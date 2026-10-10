// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {FeatureCollectionConverter} from '@loaders.gl/geoarrow';
import {GeometryConverter} from '@loaders.gl/geoarrow';

/**
 * Opt-in GIS converter bundle.
 */
export const GIS_CONVERTERS = [FeatureCollectionConverter, GeometryConverter] as const;
