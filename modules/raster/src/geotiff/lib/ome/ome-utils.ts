// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {getDims, getLabels} from './utils';
import type {OMEXML, UnitsLength} from './omexml';

/** Maps OME pixel type names to loaders.gl raster channel data types. */
export const DTYPE_LOOKUP = {
  uint8: 'uint8',
  uint16: 'uint16',
  uint32: 'uint32',
  float: 'float32',
  double: 'float64',
  int8: 'int8',
  int16: 'int16',
  int32: 'int32'
} as const;

/**
 * Extracts pixel-source labels, shape helpers, and physical-size metadata from one OME image.
 */
export function getOmePixelSourceMeta({Pixels}: OMEXML[0]) {
  // e.g. 'XYZCT' -> ['t', 'c', 'z', 'y', 'x']
  const labels = getLabels(Pixels.DimensionOrder);

  // Compute "shape" of image
  const dims = getDims(labels);
  const shape: number[] = Array(labels.length).fill(0);
  shape[dims('t')] = Pixels.SizeT;
  shape[dims('c')] = Pixels.SizeC;
  shape[dims('z')] = Pixels.SizeZ;

  // Push extra dimension if data are interleaved.
  if (Pixels.Interleaved) {
    // @ts-ignore
    labels.push('_c');
    shape.push(3);
  }

  // Creates a new shape for different level of pyramid.
  // Assumes factor-of-two downsampling.
  const getShape = (level: number) => {
    const s = [...shape];
    s[dims('x')] = Pixels.SizeX >> level;
    s[dims('y')] = Pixels.SizeY >> level;
    return s;
  };

  if (!(Pixels.Type in DTYPE_LOOKUP)) {
    throw Error(`Pixel type ${Pixels.Type} not supported.`);
  }

  const dtype = DTYPE_LOOKUP[Pixels.Type as keyof typeof DTYPE_LOOKUP];
  if (Pixels.PhysicalSizeX && Pixels.PhysicalSizeY) {
    const physicalSizes: {
      [k: string]: {size: number; unit: UnitsLength};
    } = {
      x: {
        size: Pixels.PhysicalSizeX,
        unit: Pixels.PhysicalSizeXUnit
      },
      y: {
        size: Pixels.PhysicalSizeY,
        unit: Pixels.PhysicalSizeYUnit
      }
    };
    if (Pixels.PhysicalSizeZ) {
      physicalSizes.z = {
        size: Pixels.PhysicalSizeZ,
        unit: Pixels.PhysicalSizeZUnit
      };
    }
    return {labels, getShape, physicalSizes, dtype};
  }

  return {labels, getShape, dtype};
}
