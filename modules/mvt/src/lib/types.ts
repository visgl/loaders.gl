export type MVTOptions = {
  coordinates: string | number[];
  tileIndex: {x: number; y: number; z: number};
  layerProperty: string | number;
  layerName: string;
};

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
