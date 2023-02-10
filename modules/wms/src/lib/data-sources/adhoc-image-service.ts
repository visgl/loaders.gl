// loaders.gl, MIT license

import type {ImageType} from '@loaders.gl/images';
import {ImageLoader} from '@loaders.gl/images';

import type {ImageSourceMetadata, GetImageParameters} from './image-source';
import {ImageSource} from './image-source';

export type AdHocImageServiceProps = {
  /** Template URL string should contain `${width}` etc which will be substituted. */
  templateUrl: string;
};

/**
 * Quickly connect to "ad hoc" image sources without subclassing ImageSource.
 * ImageSource allows template url strings to be used to ad hoc connect to arbitrary image data sources
 * Accepts a template url string and builds requests URLs
 */
export class AdHocImageService extends ImageSource {
  static type: 'template' = 'template';
  static testURL = (url: string): boolean => url.toLowerCase().includes('{');

  templateUrl: string;

  constructor(props: AdHocImageServiceProps) {
    super();
    this.templateUrl = props.templateUrl;
  }

  // IMAGE SOURCE API

  async getMetadata(): Promise<ImageSourceMetadata> {
    throw new Error('ImageSource.getMetadata not implemented');
  }

  async getImage(parameters: GetImageParameters): Promise<ImageType> {
    const granularParameters = this.getGranularParameters(parameters);
    const url = this.getURLFromTemplate(granularParameters);
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await ImageLoader.parse(arrayBuffer);
  }

  // HELPERS

  /** Break up bounding box in east, north, south, west */
  protected getGranularParameters(parameters: GetImageParameters): Record<string, unknown> {
    const [east, north, west, south] = parameters.bbox;
    return {...parameters, east, north, south, west};
  }

  protected getURLFromTemplate(parameters: Record<string, unknown>): string {
    let url = this.templateUrl;
    for (const [key, value] of Object.entries(parameters)) {
      // TODO - parameter could be repeated
      // const regex = new RegExp(`\${${key}}`, 'g');
      url = url.replace(`\${${key}}`, String(value));
    }
    return url;
  }
}
