// loaders.gl, MIT license

import {LoaderOptions} from '@loaders.gl/loader-utils';
import {/* ImageLoader, */ ImageType} from '@loaders.gl/images';
import type {ImageSourceMetadata, GetImageParameters} from './image-source';
import {ImageSource} from './image-source';

type FetchLike = (url: string, options?: RequestInit) => Promise<Response>;

export type ArcGISImageServiceProps = {
  url: string;
  loadOptions?: LoaderOptions;
  fetch?: typeof fetch | FetchLike;
};

export class ArcGISImageService extends ImageSource {
  static type: 'arcgis-image-server' = 'arcgis-image-server';
  static testURL = (url: string): boolean => url.toLowerCase().includes('ImageServer');

  url: string;
  loadOptions: LoaderOptions;
  fetch: typeof fetch | FetchLike;

  constructor(props: ArcGISImageServiceProps) {
    super();
    this.url = props.url;
    this.loadOptions = props.loadOptions || {};
    this.fetch = props.fetch || fetch;
  }

  // ImageSource (normalized endpoints)

  async getMetadata(): Promise<ImageSourceMetadata> {
    return (await this.info()) as ImageSourceMetadata;
    // TODO - normalize metadata
  }

  async getImage(parameters: GetImageParameters): Promise<ImageType> {
    throw new Error('not implemented');
    // TODO - Map generic parameters to ArcGIS specific parameters
    // return await this.exportImage(parameters);
  }

  // ImageServer endpoints

  async info(): Promise<unknown> {
    // We just need a JSON parsing...
    // return this.getUrl({path: '', ...options});
    throw new Error('not implemented');
  }

  /** 
   * Form a URL to an ESRI ImageServer
   // https://sampleserver6.arcgisonline.com/arcgis/rest/services/NLCDLandCover2001/ImageServer/exportImage?bbox=${bounds[0]},${bounds[1]},${bounds[2]},${bounds[3]}&bboxSR=4326&size=${width},${height}&imageSR=102100&time=&format=jpgpng&pixelType=U8&noData=&noDataInterpretation=esriNoDataMatchAny&interpolation=+RSP_NearestNeighbor&compression=&compressionQuality=&bandIds=&mosaicRule=&renderingRule=&f=image`,
   */
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

  infoURL(options: {parameters?: Record<string, unknown>}): string {
    return this.url;
    // return this.getUrl({path: '', ...options});
  }

  /** 
   * Form a URL to an ESRI ImageServer
   // https://sampleserver6.arcgisonline.com/arcgis/rest/services/NLCDLandCover2001/ImageServer/exportImage?bbox=${bounds[0]},${bounds[1]},${bounds[2]},${bounds[3]}&bboxSR=4326&size=${width},${height}&imageSR=102100&time=&format=jpgpng&pixelType=U8&noData=&noDataInterpretation=esriNoDataMatchAny&interpolation=+RSP_NearestNeighbor&compression=&compressionQuality=&bandIds=&mosaicRule=&renderingRule=&f=image`,
   */
  exportImageURL(options: {
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
  }): string {
    // const {boundingBox} = options;
    // const bbox = `bbox=${boundingBox[0]},${boundingBox[1]},${boundingBox[2]},${boundingBox[3]}`;
    // const size = `size=${width},${height}`;
    // return this.getUrl({path: 'exportImage'});
    return this.url;
  }

  // INTERNAL METHODS

  /**
   * @note protected, since perhaps getWMSUrl may need to be overridden to handle certain backends?
   * @note if override is common, maybe add a callback prop?
   * */
  protected getUrl(options: Record<string, unknown>, extra?: Record<string, unknown>): string {
    let url = `${this.url}`;
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

  /** Checks for and parses a WMS XML formatted ServiceError and throws an exception */
  protected async checkResponse(response: Response) {
    if (!response.ok) {
      // } || response.headers['content-type'] === WMSErrorLoader.mimeTypes[0]) {
      // const arrayBuffer = await response.arrayBuffer();
      // const error = await WMSErrorLoader.parse(arrayBuffer, this.loadOptions);
      throw new Error('error');
    }
  }
}
