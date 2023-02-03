// loaders.gl, MIT license

import type {ImageType} from '@loaders.gl/images';
import {ImageLoader} from '@loaders.gl/images';

import type {ImageSourceMetadata, GetImageParameters} from './image-source';
import {ImageSource} from './image-source';

/** Accepts a template string and builds requests URLs */
export class ImageService extends ImageSource {
  template: string;

  constructor(props: {template: string}) {
    super();
    this.template = props.template;
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
    const [east, north, south, west] = parameters.bbox;
    return {...parameters, east, north, south, west};
  }

  protected getURLFromTemplate(parameters: Record<string, unknown>): string {
    let url = this.template;
    for (const [key, value] of Object.keys(parameters)) {
      const regex = new RegExp(`{${key}}`, 'g');
      url = url.replace(regex, String(value));
    }
    return this.template;
  }
}
