// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ARCGIS_IMAGE_SERVER_SOURCE_DEFAULT_OPTIONS} from './arcgis-image-server-source-options';
import type {
  ArcGISImageSourceLoaderProps,
  ArcGISExportImageParameters
} from './arcgis-image-server-source-options';
import type {ImageType} from '@loaders.gl/images';
import {ImageLoader} from '@loaders.gl/images';
import type {
  CoreAPI,
  ImageSource,
  ImageSourceMetadata,
  GetImageParameters
} from '@loaders.gl/loader-utils';
import {DataSource} from '@loaders.gl/loader-utils';
import type {LERCData} from '@loaders.gl/lerc';
import {LERCLoader} from '@loaders.gl/lerc';
import {buildArcGISResourceURL} from './arcgis-url-utils';

/**
 * ArcGIS ImageServer
 * Note - exports a big API, that could be exposed here if there is a use case
 * @see https://developers.arcgis.com/rest/services-reference/enterprise/image-service.htm
 */
export class ArcGISImageSource
  extends DataSource<string, ArcGISImageSourceLoaderProps>
  implements ImageSource
{
  constructor(url: string, props: ArcGISImageSourceLoaderProps, coreApi?: CoreAPI) {
    super(url, props, ARCGIS_IMAGE_SERVER_SOURCE_DEFAULT_OPTIONS, coreApi);
  }

  /** Returns normalized ImageSource metadata. */
  async getMetadata(): Promise<ImageSourceMetadata> {
    return normalizeArcGISImageServerMetadata(await this.metadata());
  }

  /** Requests an image from generic ImageSource parameters. */
  async getImage(parameters: GetImageParameters): Promise<ImageType> {
    const {boundingBox, width, height, crs, format, signal} = parameters;
    const spatialReference = normalizeArcGISSpatialReference(crs) || '4326';
    const imageParameters: ArcGISExportImageParameters = {
      bbox: [...boundingBox[0], ...boundingBox[1]],
      bboxSR: spatialReference,
      imageSR: spatialReference,
      width,
      height,
      format: format === 'image/png' ? 'png' : undefined
    };
    return await this.exportImage(imageParameters, signal);
  }

  /** Requests the ArcGIS ImageServer metadata document. */
  async metadata(): Promise<unknown> {
    const response = await this.fetch(this.metadataURL());
    await this.checkResponse(response);
    return await response.json();
  }

  /** Requests an exported image from the ArcGIS ImageServer endpoint. */
  async exportImage(
    options: ArcGISExportImageParameters,
    signal?: AbortSignal
  ): Promise<ImageType> {
    const response = await this.fetch(this.exportImageURL(options), signal ? {signal} : undefined);
    await this.checkResponse(response);
    const arrayBuffer = await response.arrayBuffer();
    return (await this.coreApi.parse(arrayBuffer, ImageLoader, this.loadOptions)) as ImageType;
  }

  /** Requests an analytical LERC raster from the ArcGIS ImageServer endpoint. */
  async exportRaster(
    options: ArcGISExportImageParameters,
    signal?: AbortSignal
  ): Promise<LERCData> {
    const response = await this.fetch(
      this.exportImageURL({...options, format: 'lerc'}),
      signal ? {signal} : undefined
    );
    await this.checkResponse(response);
    return (await this.coreApi.parse(
      await response.arrayBuffer(),
      LERCLoader,
      this.loadOptions
    )) as LERCData;
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
    return buildArcGISResourceURL(this.url, path, {...options, ...extra});
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

/** Normalizes EPSG-prefixed CRS strings to ArcGIS WKID values. */
function normalizeArcGISSpatialReference(
  spatialReference: string | number | undefined
): string | number | undefined {
  if (typeof spatialReference === 'string') {
    const match = /^EPSG:(\d+)$/i.exec(spatialReference);
    if (match) {
      return match[1];
    }
  }
  return spatialReference;
}

/** Normalizes ArcGIS ImageServer metadata to the generic ImageSource metadata shape. */
function normalizeArcGISImageServerMetadata(metadata: unknown): ImageSourceMetadata {
  const arcgisMetadata = metadata as any;
  const extent = arcgisMetadata.fullExtent || arcgisMetadata.extent;
  const spatialReference = arcgisMetadata.spatialReference || extent?.spatialReference;
  const wellKnownIdentifier = spatialReference?.latestWkid || spatialReference?.wkid;
  const boundingBox =
    extent && [extent.xmin, extent.ymin, extent.xmax, extent.ymax].every(Number.isFinite)
      ? ([
          [extent.xmin, extent.ymin],
          [extent.xmax, extent.ymax]
        ] as [[number, number], [number, number]])
      : undefined;
  const name = arcgisMetadata.name || arcgisMetadata.serviceDescription || '';
  return {
    name,
    title: name,
    abstract: arcgisMetadata.description || arcgisMetadata.serviceDescription || '',
    keywords: Array.isArray(arcgisMetadata.keywords) ? arcgisMetadata.keywords : [],
    layers: [
      {
        name,
        title: name,
        crs: wellKnownIdentifier ? [`EPSG:${wellKnownIdentifier}`] : undefined,
        boundingBox
      }
    ]
  };
}
