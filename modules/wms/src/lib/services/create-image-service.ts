// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ImageSource, Service} from '@loaders.gl/loader-utils';
import {ImageServiceProps} from './image-service';

export type CreateImageServiceProps = ImageServiceProps & {
  type?: string | 'auto';
};

/**
 * Creates an image source
 * If type is not supplied, will try to automatically detect the the
 * @param url URL to the image source
 * @param type type of source. if not known, set to 'auto'
 * @returns an ImageSource instance
 */
export function createImageService(
  props: CreateImageServiceProps,
  services: Service[]
): ImageSource {
  const {type = 'auto'} = props;
  const service: Service | null =
    type === 'auto' ? guessServiceType(props.url, services) : getServiceOfType(type, services);

  if (!service) {
    throw new Error('Not a valid image source type');
  }
  return service.create(props);
}

/** Guess service type from URL */
function getServiceOfType(type: string, services: Service[]): Service | null {
  // if (type === 'template') {
  //   return ImageService;
  // }

  for (const service of services) {
    if (service.type === type) {
      return service;
    }
  }

  return null;
}

/** Guess service type from URL */
function guessServiceType(url: string, services: Service[]): Service | null {
  for (const service of services) {
    if (service.testURL && service.testURL(url)) {
      return service;
    }
  }

  return null;
}
