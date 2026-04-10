// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ImageType} from '@loaders.gl/images';
import {ImageLoader} from '@loaders.gl/images';
import type {
  Source,
  DataSourceOptions,
  ImageSourceMetadata,
  GetImageParameters
} from '@loaders.gl/loader-utils';
import {DataSource, ImageSource} from '@loaders.gl/loader-utils';

/** Options for the ArcGIS ImageServer source. */
export type ArcGISImageSourceProps = DataSourceOptions & {
  'arcgis-image-server'?: {
    /** Default ArcGIS exportImage request parameters. */
    exportImageParameters?: Partial<ArcGISExportImageParameters>;
  };
};

/** Parameters for ArcGIS ImageServer exportImage requests. */
export type ArcGISExportImageParameters = {
  /** Bounding box of the requested image. */
  bbox: [number, number, number, number];
  /** Spatial reference of the supplied bbox. */
  bboxSR?: string | number;
  /** Pixel width of returned image. */
  width: number;
  /** Pixel height of returned image. */
  height: number;
  /** Spatial reference of the returned image. */
  imageSR?: string | number;
  /** Requested image format. */
  format?: 'jpgpng' | 'png' | 'png8' | 'png24' | 'jpg' | 'bmp' | 'gif' | 'tiff' | 'png32';
  /** Requested pixel type. */
  pixelType?: 'U1' | 'U2' | 'U4' | 'U8' | 'S8' | 'U16' | 'S16' | 'U32' | 'S32' | 'F32' | 'F64';
  /** NoData pixel value. */
  noData?: string | number;
  /** NoData interpretation mode. */
  noDataInterpretation?: 'esriNoDataMatchAny' | 'esriNoDataMatchAll';
  /** Resampling interpolation. */
  interpolation?: string;
  /** Compression type. */
  compression?: string;
  /** Compression quality. */
  compressionQuality?: number;
  /** Band ids to export. */
  bandIds?: string | number[];
  /** Mosaic rule JSON string or object. */
  mosaicRule?: string | Record<string, unknown>;
  /** Rendering rule JSON string or object. */
  renderingRule?: string | Record<string, unknown>;
  /** ArcGIS response format. */
  f?: 'image' | 'json' | 'pjson';
};

export const ArcGISImageServerSource = {
  name: 'ArcGISImageServer',
  id: 'arcgis-image-server',
  module: 'wms',
  version: '0.0.0',
  extensions: [],
  mimeTypes: [],
  type: 'arcgis-image-server',
  fromUrl: true,
  fromBlob: false,

  defaultOptions: {
    'arcgis-image-server': {
      // TODO - add options here
    }
  },

  testURL: (url: string): boolean => url.toLowerCase().includes('imageserver'),
  createDataSource: (url: string, props: ArcGISImageSourceProps): ArcGISImageSource =>
    new ArcGISImageSource(url, props)
} as const satisfies Source<ArcGISImageSource>;

/**
 * ArcGIS ImageServer
 * Note - exports a big API, that could be exposed here if there is a use case
 * @see https://developers.arcgis.com/rest/services-reference/enterprise/image-service.htm
 */
export class ArcGISImageSource
  extends DataSource<string, ArcGISImageSourceProps>
  implements ImageSource
{
  constructor(url: string, props: ArcGISImageSourceProps) {
    super(url, props, ArcGISImageServerSource.defaultOptions);
  }

  /** Returns normalized ImageSource metadata. */
  async getMetadata(): Promise<ImageSourceMetadata> {
    return normalizeArcGISImageServerMetadata(await this.metadata());
  }

  /** Requests an image from generic ImageSource parameters. */
  async getImage(parameters: GetImageParameters): Promise<ImageType> {
    const {boundingBox, bbox, width, height, crs, format} = parameters;
    const imageParameters: ArcGISExportImageParameters = {
      bbox: boundingBox ? [...boundingBox[0], ...boundingBox[1]] : bbox!,
      bboxSR: crs || '4326',
      imageSR: crs || '4326',
      width,
      height,
      format: format === 'image/png' ? 'png' : undefined
    };
    return await this.exportImage(imageParameters);
  }

  /** Requests the ArcGIS ImageServer metadata document. */
  async metadata(): Promise<unknown> {
    const response = await this.fetch(this.metadataURL());
    await this.checkResponse(response);
    return await response.json();
  }

  /** Requests an exported image from the ArcGIS ImageServer endpoint. */
  async exportImage(options: ArcGISExportImageParameters): Promise<ImageType> {
    const response = await this.fetch(this.exportImageURL(options));
    await this.checkResponse(response);
    const arrayBuffer = await response.arrayBuffer();
    return await ImageLoader.parse(arrayBuffer, this.loadOptions);
  }

  /** Builds a metadata URL for the ArcGIS ImageServer endpoint. */
  metadataURL(options?: {parameters?: Record<string, unknown>}): string {
    return this.getUrl('', {f: 'pjson', ...options?.parameters});
  }

  /** Builds an exportImage URL for the ArcGIS ImageServer endpoint. */
  exportImageURL(options: ArcGISExportImageParameters): string {
    const defaultParameters = this.options['arcgis-image-server']?.exportImageParameters || {};
    const {width, height, ...parameters} = {...defaultParameters, ...options};
    return this.getUrl('exportImage', {
      ...parameters,
      bbox: parameters.bbox,
      size: [width, height],
      f: parameters.f || 'image'
    });
  }

  /** Builds an ArcGIS ImageServer URL. */
  protected getUrl(
    path: string,
    options: Record<string, unknown>,
    extra?: Record<string, unknown>
  ): string {
    const baseUrl = path ? `${this.url}/${path}` : this.url;
    return `${baseUrl}?${encodeArcGISParameters({...options, ...extra})}`;
  }

  /** Checks an ArcGIS ImageServer response. */
  protected async checkResponse(response: Response): Promise<void> {
    if (!response.ok) {
      throw new Error(
        response.statusText || `ArcGIS ImageServer request failed: ${response.status}`
      );
    }
  }
}

/** Encodes ArcGIS REST query parameters. */
function encodeArcGISParameters(parameters: Record<string, unknown>): string {
  const searchParameters = new URLSearchParams();
  for (const [key, value] of Object.entries(parameters)) {
    if (value === undefined || value === null) {
      continue;
    }
    const encodedValue = Array.isArray(value) ? value.join(',') : getArcGISParameterValue(value);
    searchParameters.set(key, encodedValue);
  }
  return searchParameters.toString();
}

/** Converts an ArcGIS REST parameter value to a query string value. */
function getArcGISParameterValue(value: unknown): string {
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

/** Normalizes ArcGIS ImageServer metadata to the generic ImageSource metadata shape. */
function normalizeArcGISImageServerMetadata(metadata: unknown): ImageSourceMetadata {
  const arcgisMetadata = metadata as any;
  return {
    name: arcgisMetadata.name || arcgisMetadata.serviceDescription || '',
    title: arcgisMetadata.name || arcgisMetadata.serviceDescription || '',
    abstract: arcgisMetadata.description || arcgisMetadata.serviceDescription || '',
    keywords: Array.isArray(arcgisMetadata.keywords) ? arcgisMetadata.keywords : [],
    layers: []
  };
}
