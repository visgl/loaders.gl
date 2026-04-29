// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Schema} from '../types/schema';
import type {MeshAttribute} from './category-mesh';

/** luma.gl compatible attribute descriptors for Gaussian splat data */
export type SplatAttribute = MeshAttribute;

/** A map of Gaussian splat attributes keyed by attribute names */
export type SplatAttributes = Record<string, SplatAttribute>;

/** Geometry and metadata for Gaussian splats */
export type GaussianSplats = {
  loader?: string;
  loaderData?: {[key: string]: any};
  header?: {
    splatCount: number;
    boundingBox?: [number[], number[]];
  };
  schema: Schema;
  attributes: SplatAttributes;
};
