// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Service, ImageSource} from '@loaders.gl/loader-utils';
// import {ImageService} from '../lib/services/image-service';
import {ImageServiceProps} from '../lib/services/image-service';
import {createImageService, CreateImageServiceProps} from '../lib/services/create-image-service';

import type {WMSSourceProps} from './ogc/wms-service';
import {WMSService} from './ogc/wms-service';
import {ArcGISImageService} from './arcgis/arcgis-image-service';

export type ImageServiceType = 'wms' | 'arcgis-image-server' | 'template';

const SERVICES: Service[] = [WMSService, ArcGISImageService];

type CreateImageSourceProps = CreateImageServiceProps &
  ImageServiceProps &
  WMSSourceProps & {
    type?: ImageServiceType | 'auto';
  };

/**
 * Creates an image source
 * If type is not supplied, will try to automatically detect the the
 * @param url URL to the image source
 * @param type type of source. if not known, set to 'auto'
 * @returns an ImageSource instance
 */
export function createImageSource(props: CreateImageSourceProps): ImageSource {
  return createImageService(props, SERVICES);
}
