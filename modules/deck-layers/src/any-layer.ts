// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  CompositeLayer,
  type CompositeLayerProps,
  type DefaultProps,
  type LayersList
} from '@deck.gl/core';
import {createDataSource, _selectSource} from '@loaders.gl/core';
import type {
  DataSourceOptions,
  ImageSource,
  Loader,
  Source,
  TileSourceMetadata,
  VectorSource
} from '@loaders.gl/loader-utils';
import {isTileset3DSource, type Tileset3DSource} from '@loaders.gl/tiles';
import {type ImageSourceLayerProps, ImageSourceLayer} from './image-source-layer';
import {
  type Tile2DSourceLayerProps,
  type TileSourceRuntime,
  Tile2DSourceLayer
} from './tile-2d-source-layer';
import {type Tile3DSourceLayerProps, Tile3DSourceLayer} from './tile-3d-source-layer';
import {type VectorSourceLayerProps, VectorSourceLayer} from './vector-source-layer';

type AnyLayerData =
  | string
  | Blob
  | ImageSource
  | VectorSource
  | TileSourceRuntime
  | Tileset3DSource;

/**
 * Props for `AnyLayer`.
 *
 * `data` may be a concrete source runtime, a URL/blob that can be resolved with `sources`,
 * or a 3D tiles URL that can be rendered through loader-backed fallback.
 */
export type AnyLayerProps<DataT = unknown> = CompositeLayerProps &
  Partial<Omit<ImageSourceLayerProps, 'data' | 'sources' | 'sourceOptions' | 'layers'>> &
  Partial<Omit<VectorSourceLayerProps, 'data' | 'layers'>> &
  Partial<Omit<Tile2DSourceLayerProps<DataT>, 'data' | 'sources' | 'sourceOptions'>> &
  Partial<Omit<Tile3DSourceLayerProps<DataT>, 'data' | 'loaders' | 'loader'>> & {
    /** URL/blob input or a fully constructed source runtime. */
    data: AnyLayerData;
    /** Source factories used for source-first resolution. */
    sources?: Readonly<Source[]>;
    /** Loaders used for 3D tiles fallback and injected into source construction. */
    loaders?: Loader[];
    /** Options forwarded to `createDataSource` when `sources` are supplied. */
    sourceOptions?: DataSourceOptions;
    /** Shared `layers` prop used by image and vector child layers. */
    layers?: string | string[];
    /** Optional metadata for tile-backed rendering paths. */
    metadata?: TileSourceMetadata | null;
  };

type ResolvedAnyLayerData =
  | ImageSource
  | VectorSource
  | TileSourceRuntime
  | Tileset3DSource
  | string;

const defaultProps: DefaultProps<AnyLayerProps> = {
  id: 'any-layer',
  data: '',
  sources: {type: 'array', compare: false, value: []},
  loaders: {type: 'array', compare: false, value: []},
  sourceOptions: {type: 'object', compare: false, value: {}}
};

/**
 * Internal deck.gl dispatcher that resolves URL inputs and renders the matching source-backed layer.
 *
 * Resolution is source-first: `sources` are tested before loader-backed 3D fallback.
 * This class is exported for internal repository use and examples, and is not documented
 * beyond these TSDoc comments.
 */
export class AnyLayer<DataT = any> extends CompositeLayer<AnyLayerProps<DataT>> {
  /** deck.gl layer name used in debugging output. */
  static layerName = 'AnyLayer';

  /** Default props shared across source-backed dispatch. */
  static defaultProps: DefaultProps = defaultProps;

  /** Initialize resolved source state. */
  initializeState(): void {
    this.setState({
      resolvedData: null
    });
  }

  /** Resolve URL/blob inputs whenever the relevant props change. */
  updateState({props, oldProps, changeFlags}: any): void {
    if (
      changeFlags.dataChanged ||
      props.sources !== oldProps.sources ||
      props.loaders !== oldProps.loaders ||
      props.sourceOptions !== oldProps.sourceOptions
    ) {
      this.setState({
        resolvedData: this._resolveData(props)
      });
    }
  }

  /** Render the matching source-backed child layer. */
  renderLayers(): LayersList | null {
    const {resolvedData} = this.state as {resolvedData: ResolvedAnyLayerData | null};
    if (!resolvedData) {
      return null;
    }

    const {data, sources, sourceOptions, loaders, ...layerProps} = this.props;

    if (isImageSourceLike(resolvedData)) {
      return [new ImageSourceLayer({...layerProps, data: resolvedData} as ImageSourceLayerProps)];
    }

    if (isVectorSourceLike(resolvedData)) {
      return [new VectorSourceLayer({...layerProps, data: resolvedData} as VectorSourceLayerProps)];
    }

    if (isTileSourceRuntime(resolvedData)) {
      return [new Tile2DSourceLayer({...layerProps, data: resolvedData} as any)];
    }

    return [
      new Tile3DSourceLayer({
        ...layerProps,
        data: resolvedData,
        loaders
      } as any)
    ];
  }

  /** Resolves the `data` prop to the source/runtime consumed by one of the child layers. */
  private _resolveData(props: AnyLayerProps<DataT>): ResolvedAnyLayerData {
    const {data, sources} = props;

    if (
      isImageSourceLike(data) ||
      isVectorSourceLike(data) ||
      isTileSourceRuntime(data) ||
      isTileset3DSource(data)
    ) {
      return data;
    }

    if (typeof data !== 'string' && !(data instanceof Blob)) {
      throw new Error('AnyLayer requires a URL, Blob, or supported source runtime.');
    }

    if (sources?.length) {
      const normalizedSourceOptions = this._getNormalizedSourceOptions(props);
      const sourceType =
        normalizedSourceOptions.core?.type ||
        (normalizedSourceOptions.type as string | undefined) ||
        'auto';
      const selectedSource = _selectSource(data, [...sources], {type: sourceType, nothrow: true});

      if (selectedSource) {
        const resolvedData = createDataSource(data, sources, normalizedSourceOptions) as unknown;
        if (
          isImageSourceLike(resolvedData) ||
          isVectorSourceLike(resolvedData) ||
          isTileSourceRuntime(resolvedData) ||
          isTileset3DSource(resolvedData)
        ) {
          return resolvedData;
        }

        throw new Error(
          `AnyLayer source "${selectedSource.type}" resolved data to an unsupported runtime shape.`
        );
      }
    }

    if (typeof data === 'string' && props.loaders?.length) {
      return data;
    }

    if (typeof data === 'string') {
      throw new Error(
        'AnyLayer could not resolve the URL with `sources`, and no `loaders` were provided for 3D fallback.'
      );
    }

    throw new Error(
      'AnyLayer could not resolve the Blob with `sources`, and 3D loader fallback only supports URL inputs.'
    );
  }

  /** Inject `loaders` into the source-resolution path without overwriting caller-supplied options. */
  private _getNormalizedSourceOptions(props: AnyLayerProps<DataT>): DataSourceOptions {
    const sourceOptions = props.sourceOptions || {};
    const sourceCoreOptions = sourceOptions.core || {};
    const sourceLoaders = sourceCoreOptions.loaders || [];
    const loaders = props.loaders || [];

    return {
      ...sourceOptions,
      core: {
        ...sourceCoreOptions,
        loaders: [...sourceLoaders, ...loaders]
      }
    };
  }
}

function isImageSourceLike(value: unknown): value is ImageSource {
  return Boolean(
    value && typeof value === 'object' && 'getImage' in value && 'getMetadata' in value
  );
}

function isVectorSourceLike(value: unknown): value is VectorSource {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'getFeatures' in value &&
      'getSchema' in value &&
      'getMetadata' in value
  );
}

function isTileSourceRuntime(value: unknown): value is TileSourceRuntime {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'getTileData' in value &&
      'getMetadata' in value &&
      !('initialize' in value)
  );
}
