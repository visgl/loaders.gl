// loaders.gl, MIT license

import {ImageSource} from './image-source';
import {WMSService} from './wms-service';
import {ArcGISImageService} from './arcgis-image-service';
import {AdHocImageService} from './adhoc-image-service';

export type ImageServiceType = 'wms' | 'arcgis-image-server' | 'template';

const SERVICES = [WMSService, ArcGISImageService, AdHocImageService];

/**
 * Creates an image source
 * If type is not supplied, will try to automatically detec the the
 * @param url URL to the image source
 * @param type type of source. if not known, set to 'auto'
 * @returns an ImageSource instance
 */
export function createImageSource(url: string, type: ImageServiceType | 'auto'): ImageSource {
  const serviceType = type === 'auto' ? guessServiceType(url) : type;
  switch (serviceType) {
    case 'template':
      return new AdHocImageService({templateUrl: url});
    case 'wms':
      return new WMSService({serviceUrl: url});
    default:
      // currently only wms service supported
      throw new Error('Not a valid image source type');
  }
}

/** Guess service type from URL */
function guessServiceType(url: string): ImageServiceType {
  for (const Service of SERVICES) {
    if (Service.testURL && Service.testURL(url)) {
      return Service.type;
    }
  }
  // If all else fails, guess that this is MS service
  return 'wms';
}
