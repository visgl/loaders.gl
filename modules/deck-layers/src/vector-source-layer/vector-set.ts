// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Viewport} from '@deck.gl/core';
import type {BinaryFeatureCollection, GeoJSONTable, Schema} from '@loaders.gl/schema';
import type {GetFeaturesParameters, VectorSource, VectorSourceMetadata} from '@loaders.gl/loader-utils';

/** Mutable fetch options consumed by {@link VectorSet}. */
export type VectorSetOptions = {
  /** Source used to resolve viewport feature requests. */
  vectorSource: VectorSource;
  /** Named source layers included in each request. */
  layers: string | string[];
  /** Output CRS forwarded to the vector source. */
  crs?: string;
  /** Debounce interval applied before issuing viewport requests. */
  debounceTime?: number;
};

/** Readable snapshot of the current vector-set state. */
export type VectorSetState = {
  /** True after metadata/schema resolve successfully and a current table is available. */
  isLoaded: boolean;
  /** True while the latest viewport request is in flight. */
  isLoading: boolean;
  /** Latest accepted viewport table. */
  data: GeoJSONTable | BinaryFeatureCollection | null;
  /** Resolved source schema when available. */
  schema: Schema | null;
  /** Resolved source metadata when available. */
  metadata: VectorSourceMetadata | null;
  /** Latest accepted error, if any. */
  error: Error | null;
};

/** Subscription callbacks emitted by {@link VectorSet}. */
export type VectorSetEvents = {
  /** Called when metadata/viewport loading starts or stops. */
  onLoadingStateChange?: (isLoading: boolean) => void;
  /** Called whenever any public state changes. */
  onUpdate?: () => void;
  /** Called when a viewport request resolves and becomes current. */
  onDataLoad?: (table: GeoJSONTable | BinaryFeatureCollection) => void;
  /** Called when metadata resolves. */
  onMetadataLoad?: (metadata: VectorSourceMetadata) => void;
  /** Called when schema resolves. */
  onSchemaLoad?: (schema: Schema) => void;
  /** Called when the current metadata or viewport request fails. */
  onError?: (error: Error) => void;
};

/**
 * Small runtime helper that keeps the latest vector table in sync with the active viewport.
 *
 * `VectorSet` only accepts the most recent viewport request result and ignores stale responses.
 */
export class VectorSet {
  /** Current source and request options. */
  vectorSource: VectorSource;
  /** Layers forwarded to `VectorSource#getFeatures`. */
  layers: string | string[];
  /** Output CRS forwarded to `VectorSource#getFeatures`. */
  crs?: string;
  /** Debounce interval applied before issuing viewport requests. */
  debounceTime: number;

  /** True once the latest accepted viewport request completes successfully. */
  isLoaded = false;
  /** True while the latest viewport request is in flight. */
  isLoading = false;
  /** Latest accepted viewport table. */
  data: GeoJSONTable | BinaryFeatureCollection | null = null;
  /** Resolved source schema. */
  schema: Schema | null = null;
  /** Resolved source metadata. */
  metadata: VectorSourceMetadata | null = null;
  /** Latest accepted error. */
  error: Error | null = null;

  private readonly subscriptions = new Set<VectorSetEvents>();
  private metadataPromise: Promise<void> | null = null;
  private requestSequenceNumber = 0;
  private lastRequestKey: string | null = null;
  private loadCounter = 0;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private abortController: AbortController | null = null;

  /** Creates a new viewport-driven vector runtime for a source. */
  constructor(options: VectorSetOptions) {
    this.vectorSource = options.vectorSource;
    this.layers = options.layers;
    this.crs = options.crs;
    this.debounceTime = options.debounceTime ?? 200;
  }

  /** Creates a `VectorSet` from a vector source instance. */
  static fromVectorSource(vectorSource: VectorSource, options: Omit<VectorSetOptions, 'vectorSource'>) {
    return new VectorSet({vectorSource, ...options});
  }

  /** Returns a readable snapshot for tests and consumers. */
  getState(): VectorSetState {
    return {
      isLoaded: this.isLoaded,
      isLoading: this.isLoading,
      data: this.data,
      schema: this.schema,
      metadata: this.metadata,
      error: this.error
    };
  }

  /** Updates the source or request options used for subsequent viewport fetches. */
  setOptions(options: VectorSetOptions): void {
    const sourceChanged = options.vectorSource !== this.vectorSource;
    const layersChanged = !areLayerSelectionsEqual(options.layers, this.layers);
    const crsChanged = options.crs !== this.crs;

    this.vectorSource = options.vectorSource;
    this.layers = options.layers;
    this.crs = options.crs;
    this.debounceTime = options.debounceTime ?? this.debounceTime;

    if (sourceChanged) {
      this._cancelScheduledRequest();
      this.metadataPromise = null;
      this.schema = null;
      this.metadata = null;
      this.data = null;
      this.error = null;
      this.isLoaded = false;
      this.isLoading = false;
      this.loadCounter = 0;
      this.lastRequestKey = null;
      this.requestSequenceNumber++;
      this.emitUpdate();
      return;
    }

    if (layersChanged || crsChanged) {
      this.lastRequestKey = null;
    }
  }

  /** Loads metadata and schema once for the current source. */
  async loadMetadata(): Promise<void> {
    this.metadataPromise ||= this._loadMetadata();
    await this.metadataPromise;
  }

  /** Requests features for the supplied viewport when inputs changed. */
  async updateViewport(viewport: Viewport): Promise<void> {
    const requestParameters = this._getRequestParameters(viewport);
    const requestKey = getRequestKey(requestParameters);

    if (requestKey === this.lastRequestKey) {
      return;
    }

    this._cancelScheduledRequest();
    this._abortActiveRequest();

    if (this.debounceTime > 0) {
      await new Promise<void>(resolve => {
        this.timeoutId = setTimeout(() => {
          this.timeoutId = null;
          void this._loadFeatures(requestParameters, requestKey).finally(resolve);
        }, this.debounceTime);
      });
      return;
    }

    await this._loadFeatures(requestParameters, requestKey);
  }

  /** Subscribes to runtime state changes. */
  subscribe(events: VectorSetEvents): () => void {
    this.subscriptions.add(events);
    return () => this.subscriptions.delete(events);
  }

  /** Releases references and cancels acceptance of any in-flight request. */
  finalize(): void {
    this.requestSequenceNumber++;
    this._cancelScheduledRequest();
    this._abortActiveRequest();
    this.subscriptions.clear();
  }

  private async _loadMetadata(): Promise<void> {
    this._startLoading();
    try {
      const [metadata, schema] = await Promise.all([
        this.vectorSource.getMetadata({formatSpecificMetadata: false}),
        this.vectorSource.getSchema()
      ]);

      this.metadata = metadata;
      this.schema = schema;
      this.emitMetadataLoad(metadata);
      this.emitSchemaLoad(schema);
      this.emitUpdate();
    } catch (error) {
      this.error = normalizeError(error);
      this.emitError(this.error);
      this.emitUpdate();
      throw this.error;
    } finally {
      this._finishLoading();
    }
  }

  /** Issues the actual vector source request after debounce completes. */
  private async _loadFeatures(
    requestParameters: GetFeaturesParameters,
    requestKey: string
  ): Promise<void> {
    this.lastRequestKey = requestKey;
    const requestSequenceNumber = ++this.requestSequenceNumber;

    this._startLoading();
    this.error = null;
    this.emitUpdate();

    try {
      const abortController = new AbortController();
      this.abortController = abortController;
      const table = await this.vectorSource.getFeatures({
        ...requestParameters,
        signal: abortController.signal
      });
      if (requestSequenceNumber !== this.requestSequenceNumber) {
        return;
      }

      this.data = table;
      this.error = null;
      this.isLoaded = true;
      this.emitDataLoad(table);
      this.emitUpdate();
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }
      if (requestSequenceNumber !== this.requestSequenceNumber) {
        return;
      }

      this.error = normalizeError(error);
      this.emitError(this.error);
      this.emitUpdate();
    } finally {
      if (requestSequenceNumber === this.requestSequenceNumber) {
        this._finishLoading();
      }
    }
  }

  /** Derives generic feature request parameters from the active deck.gl viewport. */
  private _getRequestParameters(viewport: Viewport): GetFeaturesParameters {
    const bounds = viewport.getBounds();

    return {
      layers: this.layers,
      boundingBox: [
        [bounds[0], bounds[1]],
        [bounds[2], bounds[3]]
      ],
      crs: this.crs
    };
  }

  private emitUpdate(): void {
    for (const subscription of this.subscriptions) {
      subscription.onUpdate?.();
    }
  }

  private emitLoadingStateChange(isLoading: boolean): void {
    for (const subscription of this.subscriptions) {
      subscription.onLoadingStateChange?.(isLoading);
    }
  }

  private emitDataLoad(table: GeoJSONTable | BinaryFeatureCollection): void {
    for (const subscription of this.subscriptions) {
      subscription.onDataLoad?.(table);
    }
  }

  private emitMetadataLoad(metadata: VectorSourceMetadata): void {
    for (const subscription of this.subscriptions) {
      subscription.onMetadataLoad?.(metadata);
    }
  }

  private emitSchemaLoad(schema: Schema): void {
    for (const subscription of this.subscriptions) {
      subscription.onSchemaLoad?.(schema);
    }
  }

  private emitError(error: Error): void {
    for (const subscription of this.subscriptions) {
      subscription.onError?.(error);
    }
  }

  /** Increments the active load count and emits loading-state transitions. */
  private _startLoading(): void {
    const wasLoading = this.loadCounter > 0;
    this.loadCounter++;
    this.isLoading = true;
    if (!wasLoading) {
      this.emitLoadingStateChange(true);
      this.emitUpdate();
    }
  }

  /** Decrements the active load count and emits loading-state transitions. */
  private _finishLoading(): void {
    const wasLoading = this.loadCounter > 0;
    this.loadCounter = Math.max(0, this.loadCounter - 1);
    this.isLoading = this.loadCounter > 0;
    if (wasLoading && !this.isLoading) {
      this.emitLoadingStateChange(false);
      this.emitUpdate();
    }
  }

  /** Clears any pending debounced viewport request before it hits the network. */
  private _cancelScheduledRequest(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /** Aborts the current in-flight vector request, if any. */
  private _abortActiveRequest(): void {
    this.abortController?.abort();
    this.abortController = null;
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

function getRequestKey(parameters: GetFeaturesParameters): string {
  const layers = Array.isArray(parameters.layers) ? parameters.layers.join(',') : parameters.layers;
  const crs = parameters.crs || '';
  const boundingBox = parameters.boundingBox.flat().join(',');
  return `${layers}|${crs}|${boundingBox}`;
}

function areLayerSelectionsEqual(left: string | string[], right: string | string[]): boolean {
  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length && left.every((layerName, index) => layerName === right[index]);
  }
  return left === right;
}

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
