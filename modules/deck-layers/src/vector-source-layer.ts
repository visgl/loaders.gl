// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  CompositeLayer,
  type CompositeLayerProps,
  type DefaultProps,
  type Layer,
  type LayerContext,
  type UpdateParameters,
  _deepEqual as deepEqual
} from '@deck.gl/core';
import type {GeoJsonLayerProps} from '@deck.gl/layers';
import {GeoJsonLayer} from '@deck.gl/layers';
import {createDataSource} from '@loaders.gl/core';
import {type GeometryColumnBinaryFeatureCollectionScratch} from '@loaders.gl/gis';
import type {GeoJSONTable} from '@loaders.gl/schema';
import type {
  DataSourceOptions,
  Loader,
  SourceLoader,
  VectorSource,
  VectorSourceData,
  VectorSourceMetadata
} from '@loaders.gl/loader-utils';
import {isSourceLoader} from '@loaders.gl/loader-utils';
import {VectorSet} from './vector-source-layer/vector-set';
import {createGeoJsonLayerProps, type GeoArrowLayerProps} from './geoarrow-layer';
import {convertGeoArrowTableToBinaryFeatureCollection} from './geoarrow-table-adapter';
import {
  finalizeOwnedSource,
  getFirstSourceLayerName,
  resolveVisualSource,
  type ResolvedVisualSource
} from './source-layer-utils';

/** Props for {@link VectorSourceLayer}. */
export type VectorSourceLayerProps = Omit<CompositeLayerProps, 'data' | 'loaders'> & {
  /** Vector source runtime, URL, or Blob. */
  data: VectorSource | string | Blob;
  /** Parser loaders and SourceLoaders used to resolve URL/blob inputs. */
  loaders?: ReadonlyArray<Loader | SourceLoader>;
  /** @deprecated Put SourceLoaders in `loaders`. */
  sources?: Readonly<SourceLoader[]>;
  /** Options forwarded to source construction. */
  sourceOptions?: DataSourceOptions;
  /** Named source layers forwarded to `VectorSource#getFeatures`. */
  layers?: string | string[] | 'auto';
  /** Output CRS forwarded to `VectorSource#getFeatures`. */
  crs?: string;
  /** Output format forwarded to `VectorSource#getFeatures`. */
  format?: 'geojson' | 'binary' | 'arrow';
  /** Debounce interval applied before viewport requests are issued. */
  debounceTime?: number;
  /** Called when the current viewport request resolves successfully. */
  onDataLoad?: (table: VectorSourceData) => void;
  /** Called when source metadata resolves. */
  onMetadataLoad?: (metadata: VectorSourceMetadata) => void;
  /** Called when metadata or viewport requests fail. */
  onError?: (error: Error) => void;
  /** Called when metadata/viewport loading starts or stops. */
  onLoadingStateChange?: (isLoading: boolean) => void;
  /** Called when URL/Blob source resolution fails. */
  onSourceError?: (error: Error) => void;
  /** Optional props forwarded into the default `GeoJsonLayer`. */
  geoJsonLayerProps?: Partial<GeoJsonLayerProps>;
  /** Optional props forwarded into the default `GeoArrowLayer`. */
  geoArrowLayerProps?: Partial<Omit<GeoArrowLayerProps, 'data'>>;
};

type VectorSourceLayerState = {
  resolvedData: VectorSource | null;
  resolvedSource: ResolvedVisualSource | null;
  vectorSet: VectorSet | null;
  unsubscribeVectorSetEvents: (() => void) | null;
};

const defaultProps: DefaultProps<VectorSourceLayerProps> = {
  id: 'vector-source-layer',
  data: null as never,
  loaders: {type: 'array', compare: false, value: []},
  sources: {type: 'array', compare: false, value: []},
  sourceOptions: {type: 'object', compare: false, value: {}},
  layers: 'auto',
  crs: 'EPSG:4326',
  format: 'arrow',
  debounceTime: 200,
  geoJsonLayerProps: {type: 'object', compare: false, value: {}},
  geoArrowLayerProps: {type: 'object', compare: false, value: {}},
  onDataLoad: {type: 'function', value: () => {}},
  onMetadataLoad: {type: 'function', value: () => {}},
  onSourceError: {type: 'function', value: () => {}},
  onError: {
    type: 'function',
    compare: false,
    value: (error: Error) => {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  },
  onLoadingStateChange: {type: 'function', value: () => {}}
};

/**
 * Internal deck.gl layer that renders a source-backed vector table for the active viewport.
 *
 * This class is exported for internal repository use and examples, and is not documented
 * beyond these TSDoc comments.
 */
export class VectorSourceLayer extends CompositeLayer<VectorSourceLayerProps> {
  /** deck.gl layer name used in debugging output. */
  static layerName = 'VectorSourceLayer';

  /** Default props shared across source-backed vector layers. */
  static defaultProps: DefaultProps = defaultProps;

  /** Typed deck.gl state for the owned vector runtime. */
  state = null as unknown as VectorSourceLayerState;

  /** Reusable scratch buffers for WKB/WKT conversion. */
  private geometryScratch: GeometryColumnBinaryFeatureCollectionScratch = {};

  private resolutionId = 0;

  /** Creates a vector source layer with mixed parser and source loader support. */
  constructor(props: VectorSourceLayerProps) {
    super(props as any);
  }

  /** Returns true when the current vector runtime has accepted data. */
  get isLoaded(): boolean {
    return Boolean(this.state?.vectorSet?.isLoaded) && super.isLoaded;
  }

  /** Lets deck.gl know that viewport changes should trigger updates. */
  shouldUpdateState(): boolean {
    return true;
  }

  /** Initializes state on first render. */
  initializeState(): void {
    this.state = {
      resolvedData: null,
      resolvedSource: null,
      vectorSet: null,
      unsubscribeVectorSetEvents: null
    };
  }

  /** Finalizes subscriptions and owned vector state. */
  finalizeState(context: LayerContext): void {
    this.resolutionId++;
    this._releaseVectorSet();
    if (this.state.resolvedSource?.owned) {
      void finalizeOwnedSource(this.state.resolvedSource.source);
    }
    super.finalizeState(context);
  }

  /** Keeps the owned vector runtime in sync with the current source props and viewport. */
  updateState({changeFlags, props, oldProps}: UpdateParameters<this>): void {
    const dataChanged =
      changeFlags.dataChanged ||
      props.loaders !== oldProps.loaders ||
      props.sources !== oldProps.sources ||
      props.sourceOptions !== oldProps.sourceOptions;

    if (dataChanged) {
      void this.resolveVectorSource(props);
      return;
    }

    if (!this.state.vectorSet) {
      return;
    }

    if (
      !deepEqual(props.layers, oldProps.layers, 1) ||
      props.crs !== oldProps.crs ||
      props.format !== oldProps.format
    ) {
      this.state.vectorSet.setOptions(this._getVectorSetOptions(props));
      if (props.layers !== 'auto' && props.layers !== undefined) {
        void this._updateViewport();
      }
      return;
    }

    if (props.debounceTime !== oldProps.debounceTime) {
      this.state.vectorSet.setOptions(this._getVectorSetOptions(props));
      if (props.layers !== 'auto' && props.layers !== undefined) {
        void this._updateViewport();
      }
      return;
    }

    if (changeFlags.viewportChanged) {
      if (
        this.props.layers !== 'auto' ||
        (this.state.vectorSet?.layers && this.state.vectorSet.layers.length > 0)
      ) {
        void this._updateViewport();
      }
    }
  }

  private async resolveVectorSource(props: VectorSourceLayerProps): Promise<void> {
    const resolutionId = ++this.resolutionId;
    const previousSource = this.state.resolvedSource;
    try {
      const resolvedSource = await resolveVisualSource(props);
      if (resolvedSource.sourceType !== 'vector') {
        if (resolvedSource.owned) {
          await finalizeOwnedSource(resolvedSource.source);
        }
        throw new Error(
          `VectorSourceLayer expected a vector source but resolved ${resolvedSource.sourceType}.`
        );
      }
      if (resolutionId !== this.resolutionId) {
        if (resolvedSource.owned) {
          await finalizeOwnedSource(resolvedSource.source);
        }
        return;
      }
      if (previousSource?.owned && previousSource.source !== resolvedSource.source) {
        await finalizeOwnedSource(previousSource.source);
      }

      this.setState({
        resolvedData: resolvedSource.source as VectorSource,
        resolvedSource
      });
      const vectorSet = this._getOrCreateVectorSet(resolvedSource.source as VectorSource, true);
      vectorSet.setOptions(this._getVectorSetOptions(props));
      void vectorSet.loadMetadata().catch(() => {});
      if (props.layers !== 'auto' && props.layers !== undefined) {
        void this._updateViewport();
      }
    } catch (error) {
      if (resolutionId === this.resolutionId) {
        const normalizedError = error instanceof Error ? error : new Error(String(error));
        this.props.onSourceError?.(normalizedError);
        this.raiseError(normalizedError, 'resolving vector source');
      }
    }
  }

  /** Renders the current accepted vector table through `GeoJsonLayer`. */
  renderLayers(): Layer | null {
    const table = this.state.vectorSet?.data;
    if (!table) {
      return null;
    }

    if (isArrowTable(table)) {
      const geoArrowLayerProps = this.props.geoArrowLayerProps;
      const {
        geometryColumn,
        pointLayerProps,
        pathLayerProps,
        solidPolygonLayerProps,
        ...forwardedGeoArrowLayerProps
      } = geoArrowLayerProps || {};
      return new GeoJsonLayer({
        ...this.getSubLayerProps({id: 'geojson'}),
        ...createGeoJsonLayerProps(pointLayerProps, pathLayerProps, solidPolygonLayerProps),
        data: convertGeoArrowTableToBinaryFeatureCollection(table, {
          geometryColumn,
          scratch: this.geometryScratch
        }),
        ...forwardedGeoArrowLayerProps,
        ...this.props.geoJsonLayerProps
      }) as unknown as Layer;
    }

    const geoJsonData = isGeoJSONTable(table)
      ? {
          type: table.type,
          features: table.features
        }
      : table;

    return new GeoJsonLayer({
      ...this.getSubLayerProps({id: 'geojson'}),
      ...this.props.geoJsonLayerProps,
      data: geoJsonData
    }) as unknown as Layer;
  }

  /** Creates or reuses the shared vector runtime for the current source. */
  private _getOrCreateVectorSet(vectorSource: VectorSource, sourceChanged: boolean): VectorSet {
    if (!this.state.vectorSet || sourceChanged) {
      this._releaseVectorSet();

      const vectorSet = VectorSet.fromVectorSource(vectorSource, {
        layers: normalizeVectorLayers(this.props.layers),
        crs: this.props.crs,
        format: this.props.format,
        debounceTime: this.props.debounceTime
      });
      const unsubscribeVectorSetEvents = vectorSet.subscribe({
        onLoadingStateChange: isLoading => this.props.onLoadingStateChange?.(isLoading),
        onUpdate: () => this.setNeedsUpdate(),
        onDataLoad: table => this.props.onDataLoad?.(table),
        onMetadataLoad: metadata => {
          this.props.onMetadataLoad?.(metadata);
          if (this.props.layers === 'auto' || this.props.layers === undefined) {
            const layerName = getFirstSourceLayerName(metadata);
            if (layerName) {
              vectorSet.setOptions({...this._getVectorSetOptions(this.props), layers: layerName});
              void this._updateViewport();
            }
          }
        },
        onError: error => this.props.onError?.(error)
      });

      this.setState({vectorSet, unsubscribeVectorSetEvents});
      return vectorSet;
    }

    return this.state.vectorSet;
  }

  /** Tears down subscriptions and owned vector runtime state. */
  private _releaseVectorSet(): void {
    this.state?.unsubscribeVectorSetEvents?.();
    this.state?.vectorSet?.finalize();
    this.setState?.({
      vectorSet: null,
      unsubscribeVectorSetEvents: null
    });
  }

  /** Builds runtime options from the current layer props. */
  private _getVectorSetOptions(props: VectorSourceLayerProps) {
    const vectorSource = this.state.resolvedData;
    if (!vectorSource) {
      throw new Error('VectorSourceLayer source has not been resolved.');
    }
    return {
      vectorSource,
      layers:
        props.layers === 'auto' || props.layers === undefined
          ? this.state.vectorSet?.layers || []
          : props.layers,
      crs: props.crs,
      format: props.format,
      debounceTime: props.debounceTime
    };
  }

  /** Resolves URL/blob inputs to a concrete vector source. */
  _resolveData(props: VectorSourceLayerProps): VectorSource {
    if (isVectorSource(props.data)) {
      return props.data;
    }
    const loaders = props.loaders || [];
    const sourceLoaders = Array.from(
      new Set([...(props.sources || []), ...loaders.filter(isSourceLoader)])
    );
    if (!sourceLoaders.length) {
      throw new Error('VectorSourceLayer requires a SourceLoader for URL or Blob inputs.');
    }
    const parserLoaders = loaders.filter(loader => !isSourceLoader(loader));
    return createDataSource(props.data, sourceLoaders, {
      ...props.sourceOptions,
      core: {
        ...props.sourceOptions?.core,
        loaders: [...(props.sourceOptions?.core?.loaders || []), ...parserLoaders]
      }
    }) as unknown as VectorSource;
  }

  /** Requests the current viewport table when a viewport is available. */
  private async _updateViewport(): Promise<void> {
    const viewport = this.context.viewport;
    const vectorSet = this.state.vectorSet;
    if (!viewport || !vectorSet) {
      return;
    }

    await vectorSet.updateViewport(viewport);
  }
}

function isVectorSource(value: unknown): value is VectorSource {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'getMetadata' in value &&
      'getSchema' in value &&
      'getFeatures' in value
  );
}

function normalizeVectorLayers(layers: string | string[] | 'auto' | undefined): string | string[] {
  return layers === 'auto' || layers === undefined ? [] : layers;
}

function isGeoJSONTable(data: VectorSourceData): data is GeoJSONTable {
  return (data as GeoJSONTable).shape === 'geojson-table';
}

function isArrowTable(
  data: VectorSourceData
): data is Extract<VectorSourceData, {shape: 'arrow-table'}> {
  return (data as {shape?: string}).shape === 'arrow-table';
}
