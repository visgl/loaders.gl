import type {LoaderOptions} from '@loaders.gl/loader-utils';

/** For local coordinates, the tileIndex is not required */
type MVTLocalCoordinatesOptions = {
  /**
   * When set to `local`, the parser will return a flat array of GeoJSON objects with local coordinates decoded from tile origin.
   */
  coordinates: 'local';
  tileIndex: null;
};

/** In WGS84 coordinates, the tileIndex is required */
type MVTWgs84CoordinatesOptions = {
  /**
   * When set to `wgs84`, the parser will return a flat array of GeoJSON objects with coordinates in longitude, latitude decoded from the provided tile index.
   */
  coordinates: 'wgs84';

  /**
   * Mandatory with `wgs84` coordinates option. An object containing tile index values (`x`, `y`,
   * `z`) to reproject features' coordinates into WGS84.
   */
  tileIndex: {x: number; y: number; z: number};
};

export type MVTOptions = (MVTLocalCoordinatesOptions | MVTWgs84CoordinatesOptions) & {
  /**
   * When non-`null`, the layer name of each feature is added to
   * `feature.properties[layerProperty]`. (A `feature.properties` object is created if the feature
   * has no existing properties). If set to `null`, a layer name property will not be added.
   */
  layerProperty?: string | number;

  /**
   * Optional list of layer names. If not `null`, only features belonging to the named layers will
   * be included in the output. If `null`, features from all layers are returned.
   */
  layers?: string[];
  shape?: 'geojson-row-table' | 'columnar-table' | 'geojson' | 'binary' | 'binary-geometry';
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

export type MVTLoaderOptions = LoaderOptions & {
  mvt?: MVTOptions;
  gis?: {
    /**
     * When set to `true`, the parser will output the data in binary format. This is equivalent to loading the data as GeoJSON and then applying [geojsonToBinary](https://loaders.gl/modules/gis/docs/api-reference/geojson-to-binary).
     */
    binary?: boolean;
    /** @deprecated. Use options.mvt.shape */
    format?: 'geojson-row-table' | 'columnar-table' | 'geojson' | 'binary' | 'binary-geometry';
  };
};
