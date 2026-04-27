// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/loader-utils';

const binary = (name: string, id: string, format: string, extensions: string[]): Format => ({
  name,
  id,
  module: 'i3s',
  encoding: 'binary',
  format,
  extensions,
  mimeTypes: ['application/octet-stream'],
  binary: true
});

const json = (name: string, id: string, format: string): Format => ({
  name,
  id,
  module: 'i3s',
  encoding: 'json',
  format,
  extensions: ['json'],
  mimeTypes: ['application/json'],
  text: true
});

export const I3SFormat = binary('I3S', 'i3s', 'i3s', ['bin']);
export const I3SContentFormat = binary('I3S Content', 'i3s-content', 'i3s-content', ['bin']);
export const I3SAttributeFormat = binary('I3S Attribute', 'i3s-attribute', 'i3s-attribute', [
  'bin'
]);
export const I3SNodePageFormat = json('I3S Node Page', 'i3s-node-page', 'i3s-node-page');
export const SLPKFormat = {
  name: 'SLPK',
  id: 'slpk',
  module: 'i3s',
  encoding: 'zip',
  format: 'slpk',
  extensions: ['slpk'],
  mimeTypes: ['application/octet-stream'],
  binary: true
} as const satisfies Format;
export const ArcGISWebSceneFormat = json(
  'ArcGIS Web Scene',
  'arcgis-web-scene',
  'arcgis-web-scene'
);
export const I3SBuildingSceneLayerFormat = json(
  'I3S Building Scene Layer',
  'i3s-building-scene-layer',
  'i3s-building-scene-layer'
);
