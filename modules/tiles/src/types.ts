import {Vector3} from '@math.gl/core';

export type BoundingRectangle = {
  width: number;
  height: number;
};

/** Deck.gl Viewport instance type.
 * We can't import it from Deck.gl to avoid circular reference */
export type Viewport = {
  id: string;
  longitude: number;
  latitude: number;
  cameraPosition: [number, number, number];
  cameraDirection: [number, number, number];
  cameraUp: [number, number, number];
  height: number;
  width: number;
  bearing: number;
  zoom: number;
  distanceScales: {
    metersPerUnit: number;
  };
  center: [number, number, number];
  unprojectPosition: (position: [number, number, number] | Vector3) => Vector3;
  project: (coorinates: [number, number, number] | Vector3) => Vector3;
};
