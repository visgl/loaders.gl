// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

/** TODO where is this used? */
export type MVTMapboxGeometry = {
  type?: string;
  id?: number;
  length: number;
  coordinates?: any[];
};

export type MVTMapboxCoordinates = {
  type: string;
  geometry: {
    type: string;
    coordinates: MVTMapboxGeometry;
  };
  properties: {[x: string]: string | number | boolean | null};
  id?: number;
};
