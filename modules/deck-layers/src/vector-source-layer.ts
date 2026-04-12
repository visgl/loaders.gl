// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  CompositeLayer,
  type CompositeLayerProps,
  type DefaultProps,
  type Layer,
  type UpdateParameters,
  _deepEqual as deepEqual
} from '@deck.gl/core';
import type {GeoJsonLayerProps} from '@deck.gl/layers';
import {GeoJsonLayer} from '@deck.gl/layers';
import type {BinaryFeatureCollection, GeoJSONTable} from '@loaders.gl/schema';
import type {VectorSource} from '@loaders.gl/loader-utils';
import {VectorSet} from './vector-source-layer/vector-set';

/** Props for {@link VectorSourceLayer}. */
export type VectorSourceLayerProps = CompositeLayerProps & {
  /** Fully constructed loaders.gl vector source. */
  data: VectorSource;
  /** Named source layers forwarded to `VectorSource#getFeatures`. */
  layers: string | string[];
  /** Output CRS forwarded to `VectorSource#getFeatures`. */
  crs?: string;
  /** Debounce interval applied before viewport requests are issued. */
  debounceTime?: number;
  /** Called when the current viewport request resolves successfully. */
  onDataLoad?: (table: GeoJSONTable | BinaryFeatureCollection) => void;
  /** Called when metadata or viewport requests fail. */
  onError?: (error: Error) => void;
  /** Called when metadata/viewport loading starts or stops. */
  onLoadingStateChange?: (isLoading: boolean) => void;
  /** Optional props forwarded into the default `GeoJsonLayer`. */
  geoJsonLayerProps?: Partial<GeoJsonLayerProps>;
};

type VectorSourceLayerState = {
  vectorSet: VectorSet | null;
  unsubscribeVectorSetEvents: (() => void) | null;
};

const defaultProps: DefaultProps<VectorSourceLayerProps> = {
  id: 'vector-source-layer',
  crs: 'EPSG:4326',
  debounceTime: 200,
  geoJsonLayerProps: {type: 'object', compare: false, value: {}},
  onDataLoad: {type: 'function', value: () => {}},
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
      vectorSet: null,
      unsubscribeVectorSetEvents: null
    };
  }

  /** Finalizes subscriptions and owned vector state. */
  finalizeState(): void {
    this._releaseVectorSet();
  }

  /** Keeps the owned vector runtime in sync with the current source props and viewport. */
  updateState({changeFlags, props, oldProps}: UpdateParameters<this>): void {
    const dataChanged = changeFlags.dataChanged;

    if (dataChanged) {
      const vectorSet = this._getOrCreateVectorSet(props.data, true);
      vectorSet.setOptions(this._getVectorSetOptions(props));
      void vectorSet.loadMetadata().catch(() => {});
      void this._updateViewport();
      return;
    }

    if (!this.state.vectorSet) {
      return;
    }

    if (!deepEqual(props.layers, oldProps.layers, 1) || props.crs !== oldProps.crs) {
      this.state.vectorSet.setOptions(this._getVectorSetOptions(props));
      void this._updateViewport();
      return;
    }

    if (props.debounceTime !== oldProps.debounceTime) {
      this.state.vectorSet.setOptions(this._getVectorSetOptions(props));
      void this._updateViewport();
      return;
    }

    if (changeFlags.viewportChanged) {
      void this._updateViewport();
    }
  }

  /** Renders the current accepted vector table through `GeoJsonLayer`. */
  renderLayers(): Layer | null {
    const table = this.state.vectorSet?.data;
    if (!table) {
      return null;
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
        layers: this.props.layers,
        crs: this.props.crs,
        debounceTime: this.props.debounceTime
      });
      const unsubscribeVectorSetEvents = vectorSet.subscribe({
        onLoadingStateChange: isLoading => this.props.onLoadingStateChange?.(isLoading),
        onUpdate: () => this.setNeedsUpdate(),
        onDataLoad: table => this.props.onDataLoad?.(table),
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
    return {
      vectorSource: props.data,
      layers: props.layers,
      crs: props.crs,
      debounceTime: props.debounceTime
    };
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

function isGeoJSONTable(
  data: GeoJSONTable | BinaryFeatureCollection
): data is GeoJSONTable {
  return (data as GeoJSONTable).shape === 'geojson-table';
}
