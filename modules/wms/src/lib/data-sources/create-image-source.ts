// loaders.gl, MIT license

import {ImageSource} from './image-source';
import {ImageService, ImageServiceProps} from './image-services/image-service';
import {WMSService} from './image-services/wms-service';
import {ArcGISImageService} from './image-services/arcgis-image-service';

export type ImageServiceType = 'wms' | 'arcgis-image-server' | 'template';

const SERVICES = [WMSService, ArcGISImageService, ImageService];

type Props = ImageServiceProps & {
  type?: ImageServiceType | 'auto';
};

/**
 * Creates an image source
 * If type is not supplied, will try to automatically detec the the
 * @param url URL to the image source
 * @param type type of source. if not known, set to 'auto'
 * @returns an ImageSource instance
 */
export function createImageSource(props: Props): ImageSource {
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
