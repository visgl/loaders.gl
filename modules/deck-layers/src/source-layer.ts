// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {CompositeLayer, type CompositeLayerProps, type LayersList} from '@deck.gl/core';
import type {Tile3DLayerProps} from '@deck.gl/geo-layers';
import {createDataSource} from '@loaders.gl/core';
import type {
  DataSource,
  DataSourceOptions,
  Source,
  TileSourceMetadata
} from '@loaders.gl/loader-utils';
import {isTileset3DSource, type Tileset3DSource} from '@loaders.gl/tiles';
import {Tile3DSourceLayer} from './tile-3d-source-layer';
import {
  TileSourceLayer,
  type TileSourceLayerProps,
  type TileSourceRuntime
} from './tile-source-layer';

/**
 * Props for `SourceLayer`.
 *
 * `data` may be a concrete tile source, a concrete tileset source, or a URL/blob that can be
 * resolved using `sources` or the 3D layer loader props.
 */
export type SourceLayerProps<DataT = unknown> = CompositeLayerProps &
  Partial<Omit<TileSourceLayerProps, 'data'>> &
  Partial<Omit<Tile3DLayerProps<DataT>, 'data'>> & {
    /** A tile source, tileset source, or URL/blob from which one can be created. */
    data: string | Blob | TileSourceRuntime | Tileset3DSource;
    /** Source factories used to auto-create tile sources from a URL/blob. */
    sources?: Readonly<Source[]>;
    /** Options forwarded to `createDataSource` when `sources` are supplied. */
    sourceOptions?: DataSourceOptions;
    /** Optional metadata for `TileSourceLayer`. */
    metadata?: TileSourceMetadata | null;
  };

/**
 * Internal union of source values that can be rendered once `data` resolution finishes.
 */
type ResolvedSourceData =
  | string
  | TileSourceRuntime
  | DataSource<any, any>
  | Tileset3DSource
  | null;

/**
 * Internal deck.gl dispatcher that selects the appropriate source-backed layer for an input.
 *
 * This class is exported for internal repository use and examples, and is not documented
 * beyond these TSDoc comments.
 */
export class SourceLayer<
  DataT = any,
  ExtraProps extends Record<string, unknown> = Record<string, unknown>
> extends CompositeLayer<SourceLayerProps<DataT> & ExtraProps> {
  /** deck.gl layer name used in debugging output. */
  static layerName = 'SourceLayer';

  /** Initialize resolved source state. */
  initializeState(): void {
    this.setState({
      resolvedData: null
    });
  }

  /** Resolve URL/blob inputs to concrete source instances when props change. */
  updateState({props, oldProps, changeFlags}: any): void {
    if (
      changeFlags.dataChanged ||
      props.sources !== oldProps.sources ||
      props.sourceOptions !== oldProps.sourceOptions
    ) {
      this.setState({
        resolvedData: this._resolveData(props)
      });
    }
  }

  /** Render either `TileSourceLayer` or `Tile3DSourceLayer` based on the resolved source type. */
  renderLayers(): LayersList | null {
    const {resolvedData} = this.state as {resolvedData: ResolvedSourceData};
    if (!resolvedData) {
      return null;
    }

    const {sources, sourceOptions, metadata, ...layerProps} = this.props;
    if (isTileSourceRuntime(resolvedData)) {
      return [
        new TileSourceLayer({
          ...layerProps,
          data: resolvedData,
          metadata
        } as unknown as TileSourceLayerProps)
      ];
    }

    return [
      new Tile3DSourceLayer({
        ...layerProps,
        data: resolvedData
      } as any)
    ];
  }

  /**
   * Resolves the `data` prop to a tile source or tileset source.
   */
  private _resolveData(props: SourceLayerProps<DataT>): ResolvedSourceData {
    const {data, sources, sourceOptions = {}} = props;

    if (isTileSourceRuntime(data) || isTileset3DSource(data)) {
      return data;
    }

    if ((typeof data === 'string' || data instanceof Blob) && sources?.length) {
      return createDataSource(data, sources, sourceOptions) as unknown as TileSourceRuntime;
    }

    if (typeof data === 'string') {
      return data;
    }

    throw new Error('SourceLayer requires `sources` to resolve Blob inputs');
  }
}

/**
 * Detects whether a resolved `data` value is a loaders.gl tile source runtime.
 * @param value Value to test.
 * @returns `true` when the value matches the runtime tile source shape.
 */
function isTileSourceRuntime(value: unknown): value is TileSourceRuntime {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'getTileData' in value &&
      'getMetadata' in value &&
      !('initialize' in value)
  );
}
