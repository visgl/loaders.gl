// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Source, SourceArrayDataSourceType, DataSourceOptions} from '@loaders.gl/loader-utils';
import type {WMSSourceOptions} from '../../wms-source';
import {WMSSource} from '../../wms-source';
import {ArcGISImageServerSource} from '../../arcgis/arcgis-image-source';

export type ImageSourceType = 'wms' | 'arcgis-image-server' | 'template';

const SOURCES = [WMSSource, ArcGISImageServerSource] as const;

/**
 * * @deprecated Use createDataSource from @loaders.gl/core
 */
type CreateImageSourceOptions = DataSourceOptions &
  WMSSourceOptions & {
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
export function createImageSource<SourceArrayT extends Source[]>(options: {
  url: string;
  type: string;
  loadOptions: any;
  options: Readonly<CreateImageSourceOptions>; // Readonly<SourceArrayOptionsType<SourceArrayT>>,
  sources: Readonly<Source[]>;
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
function getSourceOfType(type: string, sources: Readonly<Source[]>): Source | null {
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
function guessSourceType(url: string, sources: Readonly<Source[]>): Source | null {
  for (const source of sources) {
    if (source.testURL && source.testURL(url)) {
      return source;
    }
  }

  return null;
}
