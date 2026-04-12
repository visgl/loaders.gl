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

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/**
 * Loader for MapLibre / Mapbox style JSON metadata.
 */
export const MapStyleLoader = {
  dataType: null as unknown as ResolvedMapStyle,
  batchType: null as never,

  name: 'Map Style',
  id: 'map-style',
  module: 'mvt',
  version: VERSION,
  worker: false,
  extensions: ['json'],
  mimeTypes: ['application/json', 'application/vnd.mapbox.style+json'],
  text: true,
  options: {
    mapStyle: {}
  },
  parse: async (
    arrayBuffer: ArrayBuffer,
    options?: MapStyleLoadOptions,
    context?: LoaderContext
  ) => {
    const text = new TextDecoder().decode(arrayBuffer);
    const style = JSON.parse(text) as MapStyle;
    const resolvedStyle = await resolveMapStyle(style, {
      ...options,
      mapStyle: getMapStyleLoadOptions(options, context)
    });
    return ResolvedMapStyleSchema.parse(resolvedStyle);
  }
} as const satisfies LoaderWithParser<ResolvedMapStyle, never, MapStyleLoadOptions>;
