// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import type {Mesh} from '@loaders.gl/schema';

/** A parsed PLY mesh */
export type PLYMesh = Mesh & {
  loader: 'ply';
  loaderData: PLYHeader;
};

/** A PLY header */
export type PLYHeader = {
  format?: string;
  comments: string[];
  elements: PLYElement[];
  version?: string;
  headerLength?: number;
};

// INTERNAL TYPES

/** A general mesh header */
export type MeshHeader = {
  vertexCount?: number;
  boundingBox?: [[number, number, number], [number, number, number]];
};

/** The parsed columnar values */
export type PLYAttributes = {
  [index: string]: number[];
};

/** A top level PLY element (vertex, face,  ...) */
export type PLYElement = {
  name: string;
  count: number;
  properties: PLYProperty[];
};

/** One property in a top-level PLY element */
export type PLYProperty = {
  name: string;
  type: string;
  countType?: string;
  itemType?: string;
};
