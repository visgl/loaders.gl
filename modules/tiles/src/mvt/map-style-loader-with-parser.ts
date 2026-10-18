// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderContext, LoaderWithParser} from '@loaders.gl/loader-utils';
import {ResolvedMapStyleSchema} from './map-style-schema';
import {
  getMapStyleLoadOptions,
  resolveMapStyle,
  type MapStyle,
  type MapStyleLoadOptions,
  type ResolvedMapStyle
} from './map-style';
import {MapStyleLoader as MapStyleLoaderMetadata} from './map-style-loader';

const {preload: _MapStyleLoaderPreload, ...MapStyleLoaderMetadataWithoutPreload} =
  MapStyleLoaderMetadata;

/**
 * Loader for MapLibre / Mapbox style JSON metadata.
 */
export const MapStyleLoaderWithParser = {
  ...MapStyleLoaderMetadataWithoutPreload,
  parseText: async (text: string, options?: MapStyleLoadOptions, context?: LoaderContext) => {
    return await parseMapStyleText(text, options, context);
  },
  parse: async (
    data: ArrayBuffer | ArrayBufferView | string,
    options?: MapStyleLoadOptions,
    context?: LoaderContext
  ) => {
    return await parseMapStyleData(data, options, context);
  }
} as const satisfies LoaderWithParser<ResolvedMapStyle, never, MapStyleLoadOptions>;

/**
 * Parses raw map-style loader input that may arrive as text or bytes.
 */
async function parseMapStyleData(
  data: ArrayBuffer | ArrayBufferView | string,
  options?: MapStyleLoadOptions,
  context?: LoaderContext
): Promise<ResolvedMapStyle> {
  const text = typeof data === 'string' ? data : new TextDecoder().decode(data);
  return await parseMapStyleText(text, options, context);
}

/**
 * Parses and resolves a MapLibre / Mapbox style JSON document from text.
 */
async function parseMapStyleText(
  text: string,
  options?: MapStyleLoadOptions,
  context?: LoaderContext
): Promise<ResolvedMapStyle> {
  const style = JSON.parse(text) as MapStyle;
  const resolvedStyle = await resolveMapStyle(style, {
    ...options,
    mapStyle: getMapStyleLoadOptions(options, context)
  });
  return ResolvedMapStyleSchema.parse(resolvedStyle);
}
