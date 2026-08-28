// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {SourceLayer, type SourceLayerProps} from './source-layer';

/** @deprecated Use {@link SourceLayerProps}. */
export type AnyLayerProps<DataT = unknown> = SourceLayerProps<DataT>;

/**
 * @deprecated Use {@link SourceLayer}. This compatibility subclass retains the historical layer
 * name while sharing the canonical source-resolution implementation.
 */
export class AnyLayer<DataT = any> extends SourceLayer<DataT> {
  /** Historical layer name retained for debug tooling. */
  static layerName = 'AnyLayer';
}
