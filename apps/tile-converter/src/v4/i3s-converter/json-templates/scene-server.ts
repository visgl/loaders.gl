// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {BuilderInput} from '../../lib/utils/builder-input';

import type {SceneLayer3D} from '@loaders.gl/i3s';
/** Legacy scene service input and output fields. */
export type SceneServerRecord = {
  /** Service identifier. */
  serviceItemId?: string;
  /** Input layer name. */
  layerName?: string;
  /** Layer document. */
  layers0?: SceneLayer3D;
  /** Server version. */
  currentVersion: number;
  /** Service version. */
  serviceVersion: string;
  /** Supported protocols. */
  supportedBindings: string[];
};

/** Builds scene server with the legacy field selection and defaults. */
export function createSceneServer(input: BuilderInput<SceneServerRecord> | null | undefined) {
  const source = input ?? {};
  return {
    serviceItemId: source.serviceItemId ?? undefined,
    serviceName: source.layerName ?? undefined,
    name: source.layerName ?? undefined,
    currentVersion: source.currentVersion ?? 10.7,
    serviceVersion: source.serviceVersion ?? '1.8',
    supportedBindings: source.supportedBindings ?? ['REST'],
    layers: [source.layers0 ?? undefined]
  };
}
