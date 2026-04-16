// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  SourceArrayDataSourceType,
  DataSourceOptions,
  SourceLoader
} from '@loaders.gl/loader-utils';
import type {WMSSourceLoaderOptions} from '../../wms-source-loader';
import {WMSSourceLoader} from '../../wms-source-loader';
import {ArcGISImageServerSourceLoader} from '../../arcgis/arcgis-image-server-source-loader';

export type ImageSourceType = 'wms' | 'arcgis-image-server' | 'template';

const SOURCES = [WMSSourceLoader, ArcGISImageServerSourceLoader] as const;

/**
 * * @deprecated Use createDataSource from @loaders.gl/core
 */
type CreateImageSourceOptions = DataSourceOptions &
  WMSSourceLoaderOptions & {
    type?: ImageSourceType | 'auto';
  };

/**
 * Creates an image source
 * If type is not supplied, will try to automatically detect the the
 * @param url URL to the image source
 * @param type type of source. if not known, set to 'auto'
 * @returns an ImageSource instance
 *
 * @deprecated Use createDataSource from @loaders.gl/core
 */
export function createImageSource<SourceArrayT extends SourceLoader[]>(options: {
  url: string;
  type: string;
  loadOptions: any;
  options: Readonly<CreateImageSourceOptions>; // Readonly<SourceArrayOptionsType<SourceArrayT>>,
  sources: Readonly<SourceLoader[]>;
}): SourceArrayDataSourceType<SourceArrayT> {
  const {type = 'auto', url, sources = SOURCES, loadOptions} = options;
  const source: SourceArrayT[number] | null =
    type === 'auto' ? guessSourceType(url, sources) : getSourceOfType(type, sources);

  if (!source) {
    throw new Error('Not a valid image source type');
  }
  return source.createDataSource(url, {core: {loadOptions}});
}

/** Guess service type from URL */
function getSourceOfType(type: string, sources: Readonly<SourceLoader[]>): SourceLoader | null {
  // if (type === 'template') {
  //   return ImageSource;
  // }

  for (const source of sources) {
    if (source.type === type) {
      return source;
    }
  }

  return null;
}

/** Guess source type from URL */
function guessSourceType(url: string, sources: Readonly<SourceLoader[]>): SourceLoader | null {
  for (const source of sources) {
    if (source.testURL && source.testURL(url)) {
      return source;
    }
  }

  return null;
}
