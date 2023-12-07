// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {LoaderOptions} from '@loaders.gl/loader-utils';
import type {ImageType} from '@loaders.gl/images';
import {ImageLoader} from '@loaders.gl/images';

import type {ImageSourceMetadata, GetImageParameters} from '@loaders.gl/loader-utils';
import {ImageSource} from '@loaders.gl/loader-utils';

/** Template URL string should contain `${width}` etc which will be substituted. */
export type ImageServiceProps = {
  /** Base URL to the service */
  url: string;
  /** Any load options to the loaders.gl Loaders used by the WMSService methods */
  loadOptions?: LoaderOptions;
};

/**
 * Quickly connect to "ad hoc" image sources without subclassing ImageSource.
 * ImageSource allows template url strings to be used to ad hoc connect to arbitrary image data sources
 * Accepts a template url string and builds requests URLs
 */
export abstract class ImageService<
  PropsT extends ImageServiceProps = ImageServiceProps
> extends ImageSource<PropsT> {
  static type: string = 'template';
  static testURL = (url: string): boolean => url.toLowerCase().includes('{');

  constructor(props: PropsT) {
    super(props);
  }

  // IMAGE SOURCE API

  async getMetadata(): Promise<ImageSourceMetadata> {
    throw new Error('ImageSource.getMetadata not implemented');
  }

  async getImage(parameters: GetImageParameters): Promise<ImageType> {
    const granularParameters = this.getGranularParameters(parameters);
    const url = this.getURLFromTemplate(granularParameters);
    const response = await this.fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await ImageLoader.parse(arrayBuffer);
  }

  // HELPERS

  /** Break up bounding box in east, north, south, west */
  protected getGranularParameters(parameters: GetImageParameters): Record<string, unknown> {
    const [[east, north], [west, south]] = parameters.boundingBox;
    return {...parameters, east, north, south, west};
  }

  /** Supports both ${} and {} notations */
  protected getURLFromTemplate(parameters: Record<string, unknown>): string {
    let url = this.props.url;
    for (const [key, value] of Object.entries(parameters)) {
      // TODO - parameter could be repeated
      // const regex = new RegExp(`\${${key}}`, 'g');
      url = url.replace(`\${${key}}`, String(value));
      url = url.replace(`{${key}}`, String(value));
    }
    return url;
  }
}
