// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Projection} from '@math.gl/projection';
import type {PROJStringDefinition} from '@math.gl/crs';

/**
 * Create projection from proj4 definition to WGS84
 * @param projectionData - proj4 definition
 * @returns projection instance
 */
export const createProjection = (projectionData?: PROJStringDefinition): Projection | null => {
  if (!projectionData) {
    return null;
  }
  return new Projection({
    from: projectionData,
    to: 'WGS84'
  });
};
