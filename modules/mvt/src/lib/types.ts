export type MvtOptions = {
  coordinates: string | number[];
  tileIndex: {x: number; y: number; z: number};
  layerProperty: string | number;
  layerName: string;
};

export type MvtMapboxGeometry = {
  type?: string;
  id?: number;
  length: number;
  coordinates?: any[];
};

export type MvtMapboxCoordinates = {
  type: string;
  geometry: {
    type: string;
    coordinates: MvtMapboxGeometry;
  };
  properties: {[x: string]: string | number | boolean | null};
  id?: number;
};
