// loaders.gl, MIT license

import {ImageSource} from './sources/image-source';
import {ImageService, ImageServiceProps} from './services/generic/image-service';
import type {WMSServiceProps} from './services/ogc/wms-service';
import {WMSService} from './services/ogc/wms-service';
import {ArcGISImageServer} from './services/arcgis/arcgis-image-service';

export type ImageServiceType = 'wms' | 'arcgis-image-server' | 'template';

const SERVICES = [WMSService, ArcGISImageServer, ImageService];

type ImageSourceProps = ImageServiceProps &
  WMSServiceProps & {
    type?: ImageServiceType | 'auto';
  };

/**
 * Creates an image source
 * If type is not supplied, will try to automatically detect the the
 * @param url URL to the image source
 * @param type type of source. if not known, set to 'auto'
 * @returns an ImageSource instance
 */
export function createImageSource(props: ImageSourceProps): ImageSource<ImageSourceProps> {
  const {type = 'auto'} = props;
  const serviceType = type === 'auto' ? guessServiceType(props.url) : type;
  switch (serviceType) {
    case 'template':
      return new ImageService(props);
    case 'wms':
      return new WMSService(props);
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
