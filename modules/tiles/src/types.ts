import {NumberArray2, NumberArray3} from '@math.gl/core';

export type BoundingRectangle = {
  width: number;
  height: number;
};

/** Deck.gl Viewport instance type.
 * We can't import it from Deck.gl to avoid circular reference */
export type Viewport = {
  id: string;
  cameraPosition: NumberArray2 | NumberArray3;
  height: number;
  width: number;
  zoom: number;
  distanceScales: {
    unitsPerMeter: number[];
    metersPerUnit: number[];
  };
  center: Vector3Like;
  unprojectPosition: (position: NumberArray2 | NumberArray3) => NumberArray2 | NumberArray3;
  project: (coordinates: NumberArray2 | NumberArray3) => NumberArray2 | NumberArray3;
};

/**
 * Contain extra fields from WebMercatorViewport and FirstPersonViewport
 */
export type GeospatialViewport = Viewport & {
  /** @todo This field is not represented in Deck.gl viewports. Can be removed in the next version */
  cameraDirection: [number, number, number];
  /** @todo This field is not represented in Deck.gl viewports. Can be removed in the next version */
  cameraUp: [number, number, number];
  longitude: number;
  latitude: number;
  bearing: number;
};
