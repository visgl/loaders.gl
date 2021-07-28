import type {Mesh} from '@loaders.gl/schema';

export type PLYHeader = {
  format?: string;
  comments: string[];
  elements: any[];
  version?: string;
  headerLength?: number;
};

/** A parsed PLY mesh */
export type PLYMesh = Mesh & {
  loader: 'ply';
  loaderData: PLYHeader;
};

// INTERNAL TYPES

export type MeshHeader = {
  vertexCount?: number;
  boundingBox?: [[number, number, number], [number, number, number]];
};

export type PLYAttributes = {
  [index: string]: number[];
};

export type PLYProperty = {
  [index: string]: string;
};

export type ASCIIElement = {
  name: string;
  count: number;
  properties: any[];
};
