// loaders.gl, MIT license

import {LoaderOptions} from '@loaders.gl/loader-utils';
import type {ImageType} from '@loaders.gl/images';
import {ImageLoader} from '@loaders.gl/images';

import type {ImageSourceMetadata, GetImageParameters} from '../image-source';
import {ImageSource} from '../image-source';

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
export class ImageService extends ImageSource {
  static type: 'template' = 'template';
  static testURL = (url: string): boolean => url.toLowerCase().includes('{');

  props: Required<ImageServiceProps>;
  fetch: (url: string, options?: RequestInit) => Promise<Response>;

  constructor(props: ImageServiceProps) {
    super();
    this.props = mergeImageServiceProps(props);
    this.fetch = getFetchFunction(props);
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
    const [east, north, west, south] = parameters.bbox;
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

/**
 * Gets the current fetch function from options
 * @todo - move to loader-utils module
 * @todo - use in core module counterpart
 * @param options
 * @param context
 */
export function getFetchFunction(options?: LoaderOptions) {
  const fetchFunction = options?.fetch;

  // options.fetch can be a function
  if (fetchFunction && typeof fetchFunction === 'function') {
    return (url: string, fetchOptions?: RequestInit) => fetchFunction(url, fetchOptions);
  }

  // options.fetch can be an options object, use global fetch with those options
  const fetchOptions = options?.fetch;
  if (fetchOptions && typeof fetchOptions !== 'function') {
    return (url) => fetch(url, fetchOptions);
  }

  // else return the global fetch function
  return (url) => fetch(url);
}

export function mergeImageServiceProps(props: ImageServiceProps): Required<ImageServiceProps> {
  return {
    // Default fetch
    ...props,
    loadOptions: {
      ...props.loadOptions,
      fetch: getFetchFunction(props.loadOptions)
    }
  };
}
