// loaders.gl, MIT license

import {ImageType} from '@loaders.gl/images';
import type {ImageSourceMetadata, GetImageParameters} from '../../sources/image-source';
import type {ImageSourceProps} from '../../sources/image-source';
import {ImageSource} from '../../sources/image-source';

export type ArcGISImageServerProps = ImageSourceProps & {
  url: string;
};

/**
 * ArcGIS ImageServer
 * Note - exports a big API, that could be exposed here if there is a use case
 * @see https://developers.arcgis.com/rest/services-reference/enterprise/image-service.htm
 */
export class ArcGISImageServer extends ImageSource<ArcGISImageServerProps> {
  static type: 'arcgis-image-server' = 'arcgis-image-server';
  static testURL = (url: string): boolean => url.toLowerCase().includes('ImageServer');

  constructor(props: ArcGISImageServerProps) {
    super(props);
  }

  // ImageSource (normalized endpoints)

  async getMetadata(): Promise<ImageSourceMetadata> {
    return (await this.metadata()) as ImageSourceMetadata;
    // TODO - normalize metadata
  }

  async getImage(parameters: GetImageParameters): Promise<ImageType> {
    throw new Error('not implemented');
    // TODO - Map generic parameters to ArcGIS specific parameters
    // return await this.exportImage(parameters);
  }

  // ImageServer endpoints

  async metadata(): Promise<unknown> {
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
   */
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
   * */
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
