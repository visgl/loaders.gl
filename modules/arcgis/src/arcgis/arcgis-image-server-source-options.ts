// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ImageLoaderOptions} from '@loaders.gl/images';
import type {DataSourceOptions} from '@loaders.gl/loader-utils';

/** Options for the ArcGIS ImageServer source. */
export type ArcGISImageSourceLoaderProps = DataSourceOptions &
  ImageLoaderOptions & {
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
  format?: 'jpgpng' | 'png' | 'png8' | 'png24' | 'jpg' | 'bmp' | 'gif' | 'tiff' | 'png32' | 'lerc';
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

/** Default request options shared by metadata and runtime sources. */
export const ARCGIS_IMAGE_SERVER_SOURCE_DEFAULT_OPTIONS = {
  'arcgis-image-server': {
    // TODO - add options here
  }
};
