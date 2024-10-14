// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Source, ImageSource, ImageSourceProps} from '@loaders.gl/loader-utils';
import type {WMSImageSourceProps} from '../../services/ogc/wms-service';
import {WMSSource} from '../../services/ogc/wms-service';
import {ArcGISImageServerSource} from '../../services/arcgis/arcgis-image-server';

/** @deprecated */
export type ImageSourceType = 'wms' | 'arcgis-image-server' | 'template';

const SOURCES: Source[] = [WMSSource, ArcGISImageServerSource];

/**
 * * @deprecated Use createDataSource from @loaders.gl/core
 */
type CreateImageSourceProps = ImageSourceProps &
  WMSImageSourceProps & {
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
export function createImageSource(
  url: string,
  props: CreateImageSourceProps = {},
  sources = SOURCES
): ImageSource {
  const {type = 'auto'} = props;
  const source: Source | null =
    type === 'auto' ? guessSourceType(url, sources) : getSourceOfType(type, sources);

  if (!source) {
    throw new Error('Not a valid image source type');
  }
  return source.createDataSource(url, props) as unknown as ImageSource;
}

/** Guess service type from URL */
function getSourceOfType(type: string, sources: Source[]): Source | null {
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
function guessSourceType(url: string, sources: Source[]): Source | null {
  for (const source of sources) {
    if (source.testURL && source.testURL(url)) {
      return source;
    }
  }

  return null;
}
