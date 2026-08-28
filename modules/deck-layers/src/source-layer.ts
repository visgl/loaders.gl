// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  CompositeLayer,
  type CompositeLayerProps,
  type DefaultProps,
  type LayerContext,
  type LayersList
} from '@deck.gl/core';
import type {Tile3DLayerProps} from '@deck.gl/geo-layers';
import type {
  DataSourceOptions,
  ImageSource,
  Loader,
  RasterSource,
  SourceLoader,
  TileSourceMetadata,
  VectorSource
} from '@loaders.gl/loader-utils';
import type {PointCloudTilesetSource, Tileset3DSource} from '@loaders.gl/tiles';
import {type ImageSourceLayerProps, ImageSourceLayer} from './image-source-layer';
import {type PointCloudSourceLayerProps, PointCloudSourceLayer} from './point-cloud-source-layer';
import {type RasterSourceLayerProps, RasterSourceLayer} from './raster-source-layer';
import {
  createSourceViewState,
  finalizeOwnedSource,
  getFirstSourceLayerName,
  getSourceCoordinateReferenceSystem,
  loadVisualSourceMetadata,
  resolveVisualSource,
  type ResolvedVisualSource,
  type SourceLayerLoadInfo,
  type SourceLayerViewState
} from './source-layer-utils';
import {
  type Tile2DSourceLayerProps,
  type TileSourceRuntime,
  Tile2DSourceLayer
} from './tile-2d-source-layer';
import {type Tile3DSourceLayerProps, Tile3DSourceLayer} from './tile-3d-source-layer';
import {type VectorSourceLayerProps, VectorSourceLayer} from './vector-source-layer';

/** Inputs accepted by the canonical source-backed deck.gl layer. */
export type SourceLayerData =
  | string
  | Blob
  | ImageSource
  | VectorSource
  | RasterSource
  | TileSourceRuntime
  | PointCloudTilesetSource
  | Tileset3DSource;

/** Props for {@link SourceLayer}. */
export type SourceLayerProps<DataT = unknown> = Omit<CompositeLayerProps, 'data' | 'loaders'> &
  Partial<
    Omit<
      ImageSourceLayerProps,
      'data' | 'loaders' | 'sources' | 'sourceOptions' | 'layers' | 'onMetadataLoad'
    >
  > &
  Partial<
    Omit<VectorSourceLayerProps, 'data' | 'loaders' | 'sources' | 'sourceOptions' | 'layers'>
  > &
  Partial<
    Omit<
      RasterSourceLayerProps,
      'data' | 'loaders' | 'sources' | 'sourceOptions' | 'metadata' | 'onMetadataLoad'
    >
  > &
  Partial<
    Omit<
      Tile2DSourceLayerProps<DataT>,
      'data' | 'loaders' | 'sources' | 'sourceOptions' | 'onTileError'
    >
  > &
  Partial<
    Omit<
      PointCloudSourceLayerProps,
      'data' | 'loaders' | 'sources' | 'sourceOptions' | 'metadata' | 'onSourceError'
    >
  > &
  Partial<Omit<Tile3DLayerProps<DataT>, 'data' | 'loader' | 'loaders' | 'onTileError'>> & {
    /** URL/blob input or a fully constructed visual source runtime. */
    data: SourceLayerData;
    /** Parser loaders and SourceLoaders available for automatic resolution. */
    loaders?: ReadonlyArray<Loader | SourceLoader>;
    /** Singular loader compatibility prop. */
    loader?: Loader | SourceLoader | Array<Loader | SourceLoader>;
    /** @deprecated Put SourceLoaders in `loaders`. */
    sources?: Readonly<SourceLoader[]>;
    /** Options forwarded to source construction. */
    sourceOptions?: DataSourceOptions;
    /** Named source layer selection, or automatic first-leaf discovery. */
    layers?: string | string[] | 'auto';
    /** Optional preloaded normalized source metadata. */
    metadata?: unknown | null;
    /** Called after a runtime source has been resolved and classified. */
    onSourceLoad?: (info: SourceLayerLoadInfo) => void;
    /** Called after normalized source metadata has loaded. */
    onMetadataLoad?: (metadata: unknown, info: SourceLayerLoadInfo) => void;
    /** Called with non-binding navigation hints derived from source metadata. */
    onViewStateLoad?: (viewState: SourceLayerViewState, info: SourceLayerLoadInfo) => void;
    /** Called when source resolution, classification, or metadata discovery fails. */
    onSourceError?: (error: Error, info?: SourceLayerLoadInfo) => void;
    /** Error callback for either 2D or 3D tile runtimes. */
    onTileError?:
      | ((error: unknown, tileParameters?: unknown) => void)
      | ((tile: unknown, url: string, message: string) => void);
  };

type SourceLayerState = {
  resolvedSource: ResolvedVisualSource | null;
  metadata: unknown | null;
  resolvedLayers: string | string[] | undefined;
  resolvedCoordinateReferenceSystem: string | undefined;
  isResolving: boolean;
};

const defaultProps: DefaultProps<SourceLayerProps> = {
  id: 'source-layer',
  data: '',
  loaders: {type: 'array', compare: false, value: []},
  sources: {type: 'array', compare: false, value: []},
  sourceOptions: {type: 'object', compare: false, value: {}},
  layers: 'auto',
  onSourceLoad: {type: 'function', value: () => {}},
  onMetadataLoad: {type: 'function', value: () => {}},
  onViewStateLoad: {type: 'function', value: () => {}},
  onSourceError: {type: 'function', value: () => {}}
};

/**
 * Canonical internal deck.gl adapter for loaders.gl visual sources.
 *
 * The layer accepts URLs, Blobs, or concrete source runtimes. A single mixed `loaders` array may
 * contain SourceLoaders and parser loaders; the former construct a runtime source and the latter
 * remain available to that source or the parser-backed 3D Tiles fallback.
 */
export class SourceLayer<DataT = any> extends CompositeLayer<SourceLayerProps<DataT>> {
  /** deck.gl layer name used in debugging output. */
  static layerName = 'SourceLayer';

  /** Synchronous prop definitions preserve URL and Blob inputs for source selection. */
  static defaultProps: DefaultProps = defaultProps;

  /** Typed source resolution state. */
  state = null as unknown as SourceLayerState;

  private resolutionId = 0;

  /** Creates a source layer without deck.gl's parser-only loader constraint. */
  constructor(props: SourceLayerProps<DataT>) {
    super(props as any);
  }

  /** Initializes asynchronous resolution state. */
  initializeState(): void {
    this.state = {
      resolvedSource: null,
      metadata: null,
      resolvedLayers: undefined,
      resolvedCoordinateReferenceSystem: undefined,
      isResolving: false
    };
  }

  /** Releases layer-owned runtime sources and invalidates pending resolutions. */
  finalizeState(context: LayerContext): void {
    this.resolutionId++;
    const resolvedSource = this.state?.resolvedSource;
    if (resolvedSource?.owned) {
      void finalizeOwnedSource(resolvedSource.source);
    }
    super.finalizeState(context);
  }

  /** Returns false while the URL/Blob is still being resolved. */
  get isLoaded(): boolean {
    return !this.state?.isResolving && Boolean(this.state?.resolvedSource) && super.isLoaded;
  }

  /** Starts a fresh resolution whenever source-defining props change. */
  updateState({props, oldProps, changeFlags}: any): void {
    if (
      changeFlags.dataChanged ||
      props.loader !== oldProps.loader ||
      props.loaders !== oldProps.loaders ||
      props.sources !== oldProps.sources ||
      props.sourceOptions !== oldProps.sourceOptions ||
      props.layers !== oldProps.layers
    ) {
      void this.resolveSource(props);
    }
  }

  /** Renders the adapter matching the resolved runtime contract. */
  renderLayers(): LayersList | null {
    const {resolvedSource, metadata, resolvedLayers, resolvedCoordinateReferenceSystem} =
      this.state;
    if (!resolvedSource) {
      return null;
    }

    const {
      data,
      loader,
      loaders,
      sources,
      sourceOptions,
      layers,
      onSourceLoad,
      onMetadataLoad,
      onViewStateLoad,
      onSourceError,
      ...layerProps
    } = this.props;
    const childProps = this.getSubLayerProps({...layerProps, id: resolvedSource.sourceType});

    switch (resolvedSource.sourceType) {
      case 'image':
        return [
          new ImageSourceLayer({
            ...childProps,
            data: resolvedSource.source as ImageSource,
            layers: normalizeImageLayers(resolvedLayers),
            srs: this.props.srs || (resolvedCoordinateReferenceSystem as any)
          } as ImageSourceLayerProps)
        ];

      case 'vector':
        return [
          new VectorSourceLayer({
            ...childProps,
            data: resolvedSource.source as VectorSource,
            layers: resolvedLayers || [],
            crs: this.props.crs || resolvedCoordinateReferenceSystem
          } as VectorSourceLayerProps)
        ];

      case 'raster':
        return [
          new RasterSourceLayer({
            ...childProps,
            data: resolvedSource.source as RasterSource,
            metadata: metadata as any
          } as RasterSourceLayerProps)
        ];

      case 'tile-2d':
        return [
          new Tile2DSourceLayer({
            ...childProps,
            data: resolvedSource.source as TileSourceRuntime,
            metadata: metadata as TileSourceMetadata | null
          } as any)
        ];

      case 'point-cloud':
        return [
          new PointCloudSourceLayer({
            ...childProps,
            data: resolvedSource.source as PointCloudTilesetSource,
            metadata
          } as any)
        ];

      case 'tile-3d':
        return [
          new Tile3DSourceLayer({
            ...childProps,
            data: resolvedSource.source as string | Blob | Tileset3DSource,
            loaders: resolvedSource.parserLoaders,
            onTilesetLoad: tileset => {
              this.props.onTilesetLoad?.(tileset);
              void this.handleTilesetLoad(tileset, resolvedSource);
            }
          } as Tile3DSourceLayerProps)
        ];

      default:
        return null;
    }
  }

  private async resolveSource(props: SourceLayerProps<DataT>): Promise<void> {
    const resolutionId = ++this.resolutionId;
    const previousSource = this.state.resolvedSource;
    let activeResolvedSource: ResolvedVisualSource | null = null;
    let activeInfo: SourceLayerLoadInfo | undefined;
    this.setState({
      resolvedSource: null,
      metadata: null,
      resolvedLayers: undefined,
      resolvedCoordinateReferenceSystem: undefined,
      isResolving: true
    });

    try {
      const resolvedSource = await resolveVisualSource(props);
      activeResolvedSource = resolvedSource;
      if (resolutionId !== this.resolutionId) {
        if (resolvedSource.owned) {
          await finalizeOwnedSource(resolvedSource.source);
        }
        return;
      }

      const info = toLoadInfo(resolvedSource);
      activeInfo = info;
      this.props.onSourceLoad?.(info);
      const metadata = props.metadata || (await loadVisualSourceMetadata(resolvedSource));
      if (resolutionId !== this.resolutionId) {
        if (resolvedSource.owned) {
          await finalizeOwnedSource(resolvedSource.source);
        }
        return;
      }

      if (metadata && resolvedSource.sourceType !== 'tile-3d') {
        this.props.onMetadataLoad?.(metadata, info);
      }
      const viewState =
        resolvedSource.sourceType === 'tile-3d'
          ? null
          : await createSourceViewState(resolvedSource.source, metadata);
      if (viewState && resolutionId === this.resolutionId) {
        this.props.onViewStateLoad?.(viewState, info);
      }

      if (previousSource?.owned && previousSource.source !== resolvedSource.source) {
        await finalizeOwnedSource(previousSource.source);
      }

      const resolvedLayers =
        props.layers === undefined || props.layers === 'auto'
          ? getFirstSourceLayerName(metadata) || undefined
          : props.layers;
      this.setState({
        resolvedSource,
        metadata,
        resolvedLayers,
        resolvedCoordinateReferenceSystem: getSourceCoordinateReferenceSystem(metadata),
        isResolving: false
      });
    } catch (error) {
      if (resolutionId !== this.resolutionId) {
        return;
      }
      const normalizedError = error instanceof Error ? error : new Error(String(error));
      if (activeResolvedSource?.owned) {
        await finalizeOwnedSource(activeResolvedSource.source);
      }
      if (previousSource?.owned && previousSource.source !== activeResolvedSource?.source) {
        await finalizeOwnedSource(previousSource.source);
      }
      this.setState({isResolving: false});
      this.props.onSourceError?.(normalizedError, activeInfo);
      this.raiseError(normalizedError, 'resolving loaders.gl source');
    }
  }

  private async handleTilesetLoad(
    tileset: {
      tileset?: unknown;
      cartographicCenter?: ArrayLike<number> | null;
      zoom?: number;
      boundingVolume?: {cartographicBounds?: [number[], number[]]} | null;
    },
    resolvedSource: ResolvedVisualSource
  ): Promise<void> {
    if (this.state.resolvedSource !== resolvedSource) {
      return;
    }
    const info = toLoadInfo(resolvedSource);
    const metadata = tileset.tileset || null;
    if (metadata) {
      this.props.onMetadataLoad?.(metadata, info);
    }
    const cartographicCenter = tileset.cartographicCenter
      ? Array.from(tileset.cartographicCenter)
      : undefined;
    const viewState = await createSourceViewState(
      {
        getViewState: () => ({
          cartographicCenter,
          zoom: tileset.zoom,
          boundingVolume: tileset.boundingVolume
        })
      },
      metadata
    );
    if (viewState && this.state.resolvedSource === resolvedSource) {
      this.props.onViewStateLoad?.(viewState, info);
    }
  }
}

function toLoadInfo(resolvedSource: ResolvedVisualSource): SourceLayerLoadInfo {
  return {
    source: resolvedSource.source,
    sourceType: resolvedSource.sourceType,
    sourceLoader: resolvedSource.sourceLoader
  };
}

function normalizeImageLayers(layers: string | string[] | undefined): string[] {
  if (!layers) {
    return [];
  }
  return Array.isArray(layers) ? layers : [layers];
}

export type {
  SourceLayerLoadInfo,
  SourceLayerViewState,
  VisualSourceType
} from './source-layer-utils';
