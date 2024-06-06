// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Schema, GeoJSONTable} from '@loaders.gl/schema';
import type {
  VectorSourceProps,
  VectorSourceMetadata,
  GetFeaturesParameters,
  LoaderWithParser
} from '@loaders.gl/loader-utils';
import {Source, VectorSource} from '@loaders.gl/loader-utils';

const TEST_SERVICE =
  'https://services2.arcgis.com/CcI36Pduqd0OR4W9/ArcGIS/rest/services/Bicycle_Routes_Public/FeatureServer/0';
const TEST_QUERY =
  // eslint-disable-next-line no-template-curly-in-string
  'query?returnGeometry=true&where=1%3D1&outSR=4326&outFields=*&inSR=4326&geometry=${-90}%2C+${30}%2C+${-70}%2C+${50}&geometryType=esriGeometryEnvelope&spatialRel=esriSpatialRelIntersects&geometryPrecision=6&resultType=tile&f=geojson';

// @ts-nocheck
// type FetchLike = (url: string, options?: RequestInit) => Promise<Response>;

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
};

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

// export type ArcGISFeatureServiceProps = ArcGISImageServiceQueryOptions & {
//   url: string;
//   loadOptions?: LoaderOptions;
//   fetch?: typeof fetch | FetchLike;
// };

// export class ArcGISFeatureService {
//   url: string;
//   loadOptions: LoaderOptions;
//   fetch: typeof fetch | FetchLike;

//   constructor(props: ArcGISFeatureServiceProps) {
//     this.url = props.url;
//     this.loadOptions = props.loadOptions || {};
//     this.fetch = props.fetch || fetch;
//   }

//   // URL creators

//   metadataURL(options: {parameters?: Record<string, unknown>}): string {
//     return this.getUrl({...options});
//   }

//   /**
//    * Form a URL to an ESRI FeatureServer
// // https://services2.arcgis.com/CcI36Pduqd0OR4W9/ArcGIS/rest/services/Bicycle_Routes_Public/FeatureServer/0/query?
// //   returnGeometry=true&where=1%3D1&outSR=4326&outFields=*&inSR=4326&geometry=${-90}%2C+${30}%2C+${-70}%2C+${50}&
// //   geometryType=esriGeometryEnvelope&spatialRel=esriSpatialRelIntersects&geometryPrecision=6&resultType=tile&f=geojson`
//    */
//   exportImageURL(options: {
//     boundingBox: [number, number, number, number];
//     boundingBoxSR?: string;
//     width: number;
//     height: number;
//     imageSR?: string;
//     time?: never;
//     f?: 'geojson';
//     resultType?: 'tile';
//     noData?: never;
//     noDataInterpretation?: 'esriNoDataMatchAny';
//     interpolation?: '+RSP_NearestNeighbor';
//     compression?: never
//     compressionQuality?: never;
//     bandIds?: never;
//     mosaicRule?: never;
//     renderingRule?: never;
//     f?: 'image';
//   }): string {
//     const {boundingBox} = options;
//     // const bbox = `bbox=${boundingBox[0]},${boundingBox[1]},${boundingBox[2]},${boundingBox[3]}`;
//     // const size = `size=${width},${height}`
//     return this.getUrl({path: 'exportImage', });
//   }
// }

/**
 * @ndeprecated This is a WIP, not fully implemented
 * @see https://developers.arcgis.com/rest/services-reference/enterprise/feature-service.htm
 */
export const ArcGISFeatureServerSource = {
  name: 'ArcGISFeatureServer',
  id: 'arcgis-feature-server',
  module: 'wms',
  version: '0.0.0',
  extensions: [],
  mimeTypes: [],
  options: {
    url: undefined!,
    'arcgis-feature-server': {
      /** Tabular loaders, normally the GeoJSONLoader */
      loaders: []
    }
  },

  type: 'arcgis-feature-server',
  fromUrl: true,
  fromBlob: false,

  testURL: (url: string): boolean => url.toLowerCase().includes('FeatureServer'),
  createDataSource: (url, props: ArcGISVectorSourceProps): ArcGISVectorSource =>
    new ArcGISVectorSource(props)
} as const satisfies Source<ArcGISVectorSource, ArcGISVectorSourceProps>;

export type ArcGISVectorSourceProps = VectorSourceProps & {
  url: string;
  'arcgis-feature-server'?: {
    loaders: LoaderWithParser[];
  };
};

/**
 * ArcGIS ImageServer
 * Note - exports a big API, that could be exposed here if there is a use case
 * @see https://developers.arcgis.com/rest/services-reference/enterprise/feature-service.htm
 */
export class ArcGISVectorSource extends VectorSource<ArcGISVectorSourceProps> {
  data: string;
  protected formatSpecificMetadata: Promise<any>;

  constructor(props: ArcGISVectorSourceProps) {
    super(props);
    this.data = props.url;
    this.formatSpecificMetadata = this._getFormatSpecificMetadata();
  }

  /** TODO - not yet clear if we can find schema information in the FeatureServer metadata or if we need to request a feature */
  async getSchema(): Promise<Schema> {
    await this.getMetadata({formatSpecificMetadata: true});
    return {metadata: {}, fields: []};
  }

  async getMetadata(options: {formatSpecificMetadata}): Promise<VectorSourceMetadata> {
    // Wait for raw metadata to load
    const formatSpecificMetadata = await this.formatSpecificMetadata;

    const metadata = parseArcGISFeatureServerMetadata(formatSpecificMetadata);

    // Only add the big blob of source metadata if explicitly requested
    if (options.formatSpecificMetadata) {
      metadata.formatSpecificMetadata = formatSpecificMetadata;
    }
    return metadata;
  }

  async getFeatures(parameters: GetFeaturesParameters): Promise<GeoJSONTable> {
    const url = `${TEST_SERVICE}/${TEST_QUERY}`;
    const response = await this.fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    // TODO - hack - done to avoid pulling in selectLoader from core
    const loader = this.props['arcgis-feature-server']?.loaders?.[0];
    const table = loader?.parse(arrayBuffer);
    return table;
  }

  // ImageServer endpoints

  protected async _getFormatSpecificMetadata() {
    // PJSON is formatted by a bit slower than JSON
    const url = `${TEST_SERVICE}/f=pjson`;
    const response = await this.fetch(url);
    return await response.json();
  }
}

/*
  getArcGISOptions({
    boundingBox: [min: [x: number, y: number], max: [x: number, y: number]]
  }) {
    return {
      returnGeometry: true,
      where: '1=1',
      outFields: '*',
      inSR: 432,
      geometry: '${-90}%2C+${30}%2C+${-70}%2C+${50}',
      geometryType: 'esriGeometryEnvelope',
      spatialRel: 'esriSpatialRelIntersects',
      geometryPrecision: 6,
      resultType: 'tile',
      f: 'geojson'
    };
  }
  */

/** 
   * Form a URL to an ESRI ImageServer
   // https://sampleserver6.arcgisonline.com/arcgis/rest/services/NLCDLandCover2001/ImageServer/exportImage?bbox=${bounds[0]},${bounds[1]},${bounds[2]},${bounds[3]}&bboxSR=4326&size=${width},${height}&imageSR=102100&time=&format=jpgpng&pixelType=U8&noData=&noDataInterpretation=esriNoDataMatchAny&interpolation=+RSP_NearestNeighbor&compression=&compressionQuality=&bandIds=&mosaicRule=&renderingRule=&f=image`,
   *
  exportImage(options: {
    boundingBox: [number, number, number, number];
    boundingBoxSR?: string;
    width: number;
    height: number;
    imageSR?: string;
    time?: never;
    format?: 'jpgpng';
    pixelType?: 'U8';
    noData?: never;
    noDataInterpretation?: 'esriNoDataMatchAny';
    interpolation?: '+RSP_NearestNeighbor';
    compression?: never;
    compressionQuality?: never;
    bandIds?: never;
    mosaicRule?: never;
    renderingRule?: never;
    f?: 'image';
  }): Promise<ImageType> {
    // See WMSService.getMap()
    throw new Error('not implemented');
  }

  // URL creators

  metadataURL(options: {parameters?: Record<string, unknown>}): string {
    return `${this.props.url}?f=pjson`;
  }

  /** 
   * Form a URL to an ESRI ImageServer
   // https://sampleserver6.arcgisonline.com/arcgis/rest/services/NLCDLandCover2001/ImageServer/exportImage?
   //   bbox=${bounds[0]},${bounds[1]},${bounds[2]},${bounds[3]}&bboxSR=4326&
   //   size=${width},${height}&imageSR=102100&time=&format=jpgpng&pixelType=U8&
   //   noData=&noDataInterpretation=esriNoDataMatchAny&interpolation=+RSP_NearestNeighbor&compression=&
   //   compressionQuality=&bandIds=&mosaicRule=&renderingRule=&
   //   f=image
   *
  exportImageURL(options: {
    bbox: [number, number, number, number];
    boxSR?: string;
    width: number;
    height: number;
    imageSR?: string;
    time?: never;
    format?: 'jpgpng';
    pixelType?: 'U8';
    noData?: never;
    noDataInterpretation?: 'esriNoDataMatchAny';
    interpolation?: '+RSP_NearestNeighbor';
    compression?: never;
    compressionQuality?: never;
    bandIds?: never;
    mosaicRule?: never;
    renderingRule?: never;
    f?: 'image';
  }): string {
    const bbox = `bbox=${options.bbox[0]},${options.bbox[1]},${options.bbox[2]},${options.bbox[3]}`;
    const size = `size=${options.width},${options.height}`;
    const arcgisOptions = {...options, bbox, size};
    // @ts-expect-error
    delete arcgisOptions.width;
    // @ts-expect-error
    delete arcgisOptions.height;
    return this.getUrl('exportImage', arcgisOptions);
  }

  // INTERNAL METHODS

  /**
   * @note protected, since perhaps getWMSUrl may need to be overridden to handle certain backends?
   * @note if override is common, maybe add a callback prop?
   * 
  protected getUrl(
    path: string,
    options: Record<string, unknown>,
    extra?: Record<string, unknown>
  ): string {
    let url = `${this.props.url}/${path}`;
    let first = true;
    for (const [key, value] of Object.entries(options)) {
      url += first ? '?' : '&';
      first = false;
      if (Array.isArray(value)) {
        url += `${key.toUpperCase()}=${value.join(',')}`;
      } else {
        url += `${key.toUpperCase()}=${value ? String(value) : ''}`;
      }
    }
    return url;
  }
*/

function parseArcGISFeatureServerMetadata(json: any): VectorSourceMetadata {
  const layers: VectorSourceMetadata['layers'] = [];
  for (const layer of json.layers || []) {
    layers.push({
      // id: layer.id,
      name: layer.name
    });
  }

  return {
    // version: json.currentVersion || '',
    title: json.serviceDescription || '',
    name: json.serviceDescription || '',
    abstract: json.description || '',
    keywords: [],
    // attrribution: json.copyrightText || ''.
    // crs: 'EPSG:4326',
    layers
  };
}

/** Sample metadata
 * @see https://developers.arcgis.com/rest/services-reference/enterprise/feature-service.htm
 */
//     "currentVersion": 11.1,
//     "serviceDescription": "Birds",
//     "hasVersionedData": false,
//     "supportsDisconnectedEditing: false,
//     "supportsDatumTransformation": true,
//     "supportsReturnDeleteResults": true,
//     "supportsRelationshipsResource": true,
//     "syncEnabled": false,
//     "supportedExportFormats": "sqlite,filegdb,shapefile,csv,geojson",
//     "hasStaticData": false,
//     "maxRecordCount": 1000,
//     "supportedQueryFormats": "JSON",
//     "capabilities": "Query,Create,Delete,Update,Uploads,Editing,Extract,ChangeTracking,Sync",
//     "description": "",
//     "copyrightText": "",
//     "userTypeExtensions: [
//       "utilityNetwork"
//     ],
//     "advancedEditingCapabilities": {
//       "supportsSplit": true,
//       "supportsReturnServiceEditsInSourceSR": true
//     },
//     "spatialReference": {
//       "wkid": 4326,
//       "latestWkid": 4326
//     },
//     "initialExtent": {
//       "xmin": -118.016756138237,
//       "ymin": 32.8933824408207,
//       "xmax": -116.532738278622,
//       "ymax": 34.3261469363675,
//       "spatialReference": {
//         "wkid": 4326,
//         "latestWkid": 4326
//       }
//     },
//     "fullExtent": {
//       "xmin": -117.855689264791,
//       "ymin": 32.5702577626442,
//       "xmax": -116.87086222794,
//       "ymax": 34.1460567673275,
//       "spatialReference": {
//         "wkid": 4326,
//         "latestWkid": 4326
//       }
//     },
//     "allowGeometryUpdates": true,
//     "units": "esriDecimalDegrees",
//     "syncEnabled": true,
//     "validationSystemLayers": {
//       "validationPointErrorlayerId": 1,
//       "validationLineErrorlayerId": 2,
//       "validationPolygonErrorlayerId": 3,
//       "validationObjectErrortableId": 5
//     },
//     "extractChangesCapabilities": {
//       "supportsReturnIdsOnly": true,
//       "supportsReturnExtentOnly": false,
//       "supportsReturnAttachments": false,
//       "supportsLayerQueries": false,
//       "supportsSpatialFilter": false,
//       "supportsReturnFeature": false,
//       "supportsReturnHasGeometryUpdates": true
//     },
//     "syncCapabilities": {
//       "supportsASync": true,
//       "supportsRegisteringExistingData": true,
//       "supportsSyncDirectionControl": true,
//       "supportsPerLayerSync": true,
//       "supportsPerReplicaSync": false,
//       "supportsRollbackOnFailure": false,
//       "supportedSyncDataOptions": 3
//       "supportsQueryWithDatumTransformation": true,
//     },
//     "editorTrackingInfo": {
//       "enableEditorTracking": false,
//       "enableOwnershipAccessControl": false,
//       "allowOthersToUpdate": true,
//       "allowOthersToDelete": false
//     },
//     "layers": [
//       {
//         "id": 0,
//         "name": "Sitings",
//         "parentLayerId": -1,
//         "defaultVisibility": true,
//         "subLayerIds": null,
//         "minScale": 0,
//         "maxScale": 0,
//         "geometryType": "esriGeometryPoint"
//       },
//       {
//         "id": 1,
//         "name": "NestingGrounds",
//         "parentLayerId": -1,
//         "defaultVisibility": true,
//         "subLayerIds": null,
//         "minScale": 0,
//         "maxScale": 0,
//         "geometryType": "esriGeometryPolygon"
//       },
//       {
//         "id": 2,
//         "name": "LandCover",
//         "parentLayerId": -1,
//         "defaultVisibility": true,
//         "subLayerIds": null,
//         "minScale": 0,
//         "maxScale": 0,
//         "geometryType": "esriGeometryPolygon"
//       }
//     ],
//     "tables": [],
//     "relationships": [
//      {
//       "id": 0,
//       "name": "relationship_1"
//      }
//     ],
//     "datumTransformations": [
//       {
//         "geoTransforms": [
//           {
//             "wkid": 15931,
//             "latestWkid": 15931,
//             "transformForward": false,
//             "name": NAD_1983_NSRS2007_To_WGS_1984_1"
//           }
//         ]
//       },
//       {
//         "geoTransforms": [
//           {
//             "wkid": 15931,
//             "latestWkid": 15931,
//             "transformForward": true,
//             "name": NAD_1983_NSRS2007_to_WGS_1984_1"
//           }
//         ]
//       }
//     ],
//     "isIndoorsService": true,
//     "isLocationTrackingService": true,
//     "isLocationTrackingView": true
//   }
//   The following is a portion of a JSON response example for a spatial reference, VCS, tolerance, resolution properties, and high model info:

//   ...
//    "spatialReference": {
//     "wkid": 102100,
//     "latestWkid": 3857,
//     "vcsWkid": 115700,
//     "latestVcsWkid": 115700,
//     "xyTolerance": 0.001,
//     "zTolerance": 0.001,
//     "mTolerance": 0.001,
//     "falseX": -20037700,
//     "falseY": -30241100,
//     "xyUnits": 1.4892314192838538E8,
//     "falseZ": -100000,
//     "zUnits": 10000,
//     "falseM": -100000,
//     "mUnits": 10000
//    },
//    "heightModelInfo": {
//     "heightModel": "ellipsoidal",
//     "vertCRS": "WGS_1984",
//     "heightUnit": "meter"
//    },
//   ...
//   // TODO - normalize metadata
// }
