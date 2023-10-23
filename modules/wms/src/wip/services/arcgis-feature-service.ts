// @ts-nocheck

import {LoaderOptions} from '@loaders.gl/loader-utils';
// import {GeoJSONLoader} from '@loaders.gl/geojson';

type FetchLike = (url: string, options?: RequestInit) => Promise<Response>;

export type ArcGISImageServiceQueryOptions = {
  returnGeometry: boolean;
  where: '1%3D1';
  outSR: 4326;
  outFields: string | '*';
  inSR: 4326;
  geometry: `${-90}%2C+${30}%2C+${-70}%2C+${50}`;
  geometryType: 'esriGeometryEnvelope'; // TODO - look up valid values in Esri docs
  spatialRel: 'esriSpatialRelIntersects'; // TODO - look up valid values in Esri docs
  geometryPrecision: number; // TODO - look up valid values in Esri docs
  resultType: 'tile'; // TODO - look up valid values in Esri docs
  f?: 'geojson'; // TODO - look up valid values in Esri docs
}

// const DEFAULT_QUERY_OPTIONS: Required<ArcGISImageServiceQueryOptions>  = {
//   returnGeometry:true,
//   where: '1%3D1',
//   outSR: 4326,
//   outFields: '*',
//   inSR: 4326,
//   geometry: `${-90}%2C+${30}%2C+${-70}%2C+${50}`,
//   geometryType: 'esriGeometryEnvelope',
//   spatialRel: 'esriSpatialRelIntersects',
//   geometryPrecision: 6,
//   resultType: 'tile',
//   f: 'geojson'
// };

export type ArcGISFeatureServiceProps = ArcGISImageServiceQueryOptions & {
  url: string;
  loadOptions?: LoaderOptions;
  fetch?: typeof fetch | FetchLike;
};

export class ArcGISFeatureService {
  url: string;
  loadOptions: LoaderOptions;
  fetch: typeof fetch | FetchLike;

  constructor(props: ArcGISFeatureServiceProps) {
    this.url = props.url;
    this.loadOptions = props.loadOptions || {};
    this.fetch = props.fetch || fetch;
  }

 // URL creators

  metadataURL(options: {parameters?: Record<string, unknown>}): string {
    return this.getUrl({...options});
  }

  /** 
   * Form a URL to an ESRI FeatureServer
// https://services2.arcgis.com/CcI36Pduqd0OR4W9/ArcGIS/rest/services/Bicycle_Routes_Public/FeatureServer/0/query?
//   returnGeometry=true&where=1%3D1&outSR=4326&outFields=*&inSR=4326&geometry=${-90}%2C+${30}%2C+${-70}%2C+${50}&
//   geometryType=esriGeometryEnvelope&spatialRel=esriSpatialRelIntersects&geometryPrecision=6&resultType=tile&f=geojson`
   */
  exportImageURL(options: {
    boundingBox: [number, number, number, number];
    boundingBoxSR?: string;
    width: number;
    height: number;
    imageSR?: string;
    time?: never;
    f?: 'geojson';
    resultType?: 'tile';
    noData?: never;
    noDataInterpretation?: 'esriNoDataMatchAny';
    interpolation?: '+RSP_NearestNeighbor';
    compression?: never
    compressionQuality?: never;
    bandIds?: never;
    mosaicRule?: never;
    renderingRule?: never;
    f?: 'image';
  }): string {
    const {boundingBox} = options;
    // const bbox = `bbox=${boundingBox[0]},${boundingBox[1]},${boundingBox[2]},${boundingBox[3]}`;
    // const size = `size=${width},${height}`
    return this.getUrl({path: 'exportImage', });
  }
}
