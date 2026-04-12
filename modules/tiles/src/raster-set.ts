// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  GetRasterParameters,
  RasterData,
  RasterSource,
  RasterSourceMetadata
} from '@loaders.gl/loader-utils';

/** Accepted raster request currently retained by {@link RasterSet}. */
export type RasterSetRequest<DataT = RasterData> = {
  /** Unique request id assigned by the manager. */
  requestId: number;
  /** Raster request parameters that produced the accepted raster payload. */
  parameters: GetRasterParameters;
  /** Raster retained as the current output. */
  raster: DataT;
};

/** Configuration shared by all {@link RasterSet} instances. */
export type RasterSetBaseProps<DataT = RasterData> = {
  /** Callback used to load source metadata. */
  getMetadata: () => Promise<RasterSourceMetadata>;
  /** Callback used to load raster data for a viewport-derived request. */
  getRaster: (parameters: GetRasterParameters) => Promise<DataT>;
  /** Debounce interval applied before issuing raster requests. */
  debounceTime?: number;
};

/** Options for creating a {@link RasterSet}. */
export type RasterSetProps<DataT = RasterData> = Partial<RasterSetBaseProps<DataT>> & {
  /** Optional loaders.gl raster source backing this manager. */
  rasterSource?: RasterSource | null;
};

/** Subscription callbacks emitted by {@link RasterSet}. */
export type RasterSetListener<DataT = RasterData> = {
  /** Fired when metadata/raster loading starts or stops. */
  onLoadingStateChange?: (isLoading: boolean) => void;
  /** Fired when source metadata resolves successfully. */
  onMetadataLoad?: (metadata: RasterSourceMetadata) => void;
  /** Fired when metadata loading fails. */
  onMetadataLoadError?: (error: Error) => void;
  /** Fired when a new raster request is issued. */
  onRasterLoadStart?: (requestId: number, parameters: GetRasterParameters) => void;
  /** Fired when a raster request resolves and becomes current. */
  onRasterLoad?: (request: RasterSetRequest<DataT>) => void;
  /** Fired when a raster request fails. */
  onRasterLoadError?: (requestId: number, error: Error, parameters: GetRasterParameters) => void;
  /** Fired when metadata or the current raster changes. */
  onUpdate?: () => void;
};

const DEFAULT_RASTERSET_PROPS: Required<Omit<RasterSetProps, 'rasterSource'>> = {
  getMetadata: async () => ({
    width: 0,
    height: 0,
    bandCount: 0,
    dtype: 'uint8'
  }),
  getRaster: async () =>
    ({
      data: new Uint8Array(0),
      width: 0,
      height: 0,
      bandCount: 0,
      dtype: 'uint8'
    }) as never,
  debounceTime: 0
};

/** Shared raster request manager used by viewport-driven raster examples and layers. */
export class RasterSet<DataT = RasterData> {
  /** Cached metadata returned by the backing source, if any. */
  metadata: RasterSourceMetadata | null = null;

  private _opts: Required<RasterSetProps<DataT>>;
  private _listeners = new Set<RasterSetListener<DataT>>();
  private _currentRequest: RasterSetRequest<DataT> | null = null;
  private _lastAcceptedRequestId = -1;
  private _nextRequestId = 0;
  private _loadCounter = 0;
  private _timeoutId: ReturnType<typeof setTimeout> | null = null;
  private _abortController: AbortController | null = null;
  private _finalized = false;

  /** Creates a raster manager from a source or direct callbacks. */
  constructor(opts: RasterSetProps<DataT>) {
    this._opts = this._normalizeOptions(opts);
    if (!this._opts.rasterSource && (!opts.getRaster || !opts.getMetadata)) {
      throw new Error(
        'RasterSet requires either `rasterSource` or both `getRaster` and `getMetadata`.'
      );
    }
  }

  /** Convenience factory for wrapping a loaders.gl {@link RasterSource}. */
  static fromRasterSource<DataT = RasterData>(
    rasterSource: RasterSource,
    opts: Omit<RasterSetProps<DataT>, 'rasterSource' | 'getRaster' | 'getMetadata'> = {}
  ): RasterSet<DataT> {
    return new RasterSet<DataT>({...opts, rasterSource});
  }

  /** Whether the manager has no requests in flight and a current raster. */
  get isLoaded(): boolean {
    return this._loadCounter === 0 && Boolean(this._currentRequest);
  }

  /** Current accepted raster, if any. */
  get raster(): DataT | null {
    return this._currentRequest?.raster || null;
  }

  /** Current accepted request and raster payload, if any. */
  get currentRequest(): RasterSetRequest<DataT> | null {
    return this._currentRequest;
  }

  /** Backing raster source when constructed from one. */
  get rasterSource(): RasterSource | null {
    return this._opts.rasterSource;
  }

  /** Subscribes to metadata and raster lifecycle events. */
  subscribe(listener: RasterSetListener<DataT>): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /** Updates source callbacks or debounce settings, resetting state when the source changes. */
  setOptions(opts: RasterSetProps<DataT>): void {
    const previousRasterSource = this._opts.rasterSource;
    const nextOptions = this._normalizeOptions({...this._opts, ...opts});
    const sourceChanged =
      previousRasterSource !== nextOptions.rasterSource ||
      this._opts.getRaster !== nextOptions.getRaster ||
      this._opts.getMetadata !== nextOptions.getMetadata;

    this._opts = nextOptions;

    if (sourceChanged) {
      this._cancelScheduledRaster();
      this.metadata = null;
      this._currentRequest = null;
      this._lastAcceptedRequestId = -1;
      this._nextRequestId = 0;
      this._emitUpdate();
    }
  }

  /** Loads metadata from the current raster source or callbacks. */
  async loadMetadata(): Promise<RasterSourceMetadata> {
    this._startLoading();
    try {
      const metadata = await this._opts.getMetadata();
      if (this._finalized) {
        return metadata;
      }
      this.metadata = metadata;
      for (const listener of this._listeners) {
        listener.onMetadataLoad?.(metadata);
      }
      this._emitUpdate();
      return metadata;
    } catch (error) {
      const normalizedError = normalizeRasterSetError(error, 'Raster metadata request failed');
      if (!this._finalized) {
        for (const listener of this._listeners) {
          listener.onMetadataLoadError?.(normalizedError);
        }
      }
      throw normalizedError;
    } finally {
      this._finishLoading();
    }
  }

  /** Debounces and issues a new raster request for the supplied parameters. */
  requestRaster(parameters: GetRasterParameters, debounceTime = this._opts.debounceTime): number {
    const requestId = this._nextRequestId++;
    this._cancelScheduledRaster();
    this._abortActiveRequest();

    if (debounceTime > 0) {
      this._timeoutId = setTimeout(() => {
        this._timeoutId = null;
        void this._loadRaster(requestId, parameters);
      }, debounceTime);
    } else {
      void this._loadRaster(requestId, parameters);
    }

    return requestId;
  }

  /** Clears timers and listeners held by the manager. */
  finalize(): void {
    this._finalized = true;
    this._cancelScheduledRaster();
    this._abortActiveRequest();
    this._listeners.clear();
  }

  /** Loads a raster immediately and accepts it only if it is the newest completed request. */
  private async _loadRaster(requestId: number, parameters: GetRasterParameters): Promise<void> {
    if (this._finalized) {
      return;
    }

    this._startLoading();
    for (const listener of this._listeners) {
      listener.onRasterLoadStart?.(requestId, parameters);
    }

    try {
      const abortController = new AbortController();
      this._abortController = abortController;
      const raster = await this._opts.getRaster({...parameters, signal: abortController.signal});
      if (this._finalized || requestId <= this._lastAcceptedRequestId) {
        return;
      }

      this._lastAcceptedRequestId = requestId;
      this._currentRequest = {requestId, parameters, raster};

      for (const listener of this._listeners) {
        listener.onRasterLoad?.(this._currentRequest);
      }
      this._emitUpdate();
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }
      const normalizedError = normalizeRasterSetError(error, 'Raster request failed');
      if (!this._finalized) {
        for (const listener of this._listeners) {
          listener.onRasterLoadError?.(requestId, normalizedError, parameters);
        }
      }
    } finally {
      this._abortController = null;
      this._finishLoading();
    }
  }

  /** Resolves current options from either a source or direct callbacks. */
  private _normalizeOptions(opts: RasterSetProps<DataT>): Required<RasterSetProps<DataT>> {
    const rasterSource = opts.rasterSource || null;
    return {
      ...DEFAULT_RASTERSET_PROPS,
      ...opts,
      rasterSource,
      getMetadata:
        opts.getMetadata ||
        (() => {
          if (rasterSource) {
            return rasterSource.getMetadata();
          }
          return DEFAULT_RASTERSET_PROPS.getMetadata();
        }),
      getRaster:
        opts.getRaster ||
        ((parameters: GetRasterParameters) => {
          if (rasterSource) {
            return rasterSource.getRaster(parameters) as Promise<DataT>;
          }
          return DEFAULT_RASTERSET_PROPS.getRaster(parameters) as Promise<DataT>;
        }),
      debounceTime: opts.debounceTime ?? DEFAULT_RASTERSET_PROPS.debounceTime
    };
  }

  /** Emits one generic update notification to all subscribers. */
  private _emitUpdate(): void {
    for (const listener of this._listeners) {
      listener.onUpdate?.();
    }
  }

  /** Emits one loading-state transition to all subscribers. */
  private _emitLoadingStateChange(isLoading: boolean): void {
    for (const listener of this._listeners) {
      listener.onLoadingStateChange?.(isLoading);
    }
  }

  /** Increments the active load count and emits loading-state transitions. */
  private _startLoading(): void {
    const wasLoading = this._loadCounter > 0;
    this._loadCounter++;
    if (!wasLoading) {
      this._emitLoadingStateChange(true);
      this._emitUpdate();
    }
  }

  /** Decrements the active load count and emits loading-state transitions. */
  private _finishLoading(): void {
    const wasLoading = this._loadCounter > 0;
    this._loadCounter = Math.max(0, this._loadCounter - 1);
    if (wasLoading && this._loadCounter === 0) {
      this._emitLoadingStateChange(false);
      this._emitUpdate();
    }
  }

  /** Clears any pending debounced raster request before it hits the network. */
  private _cancelScheduledRaster(): void {
    if (this._timeoutId !== null) {
      clearTimeout(this._timeoutId);
      this._timeoutId = null;
    }
  }

  /** Aborts the currently active raster request, if one exists. */
  private _abortActiveRequest(): void {
    this._abortController?.abort();
    this._abortController = null;
  }
}

/** Normalizes arbitrary thrown values to `Error` instances for raster-set callbacks. */
function normalizeRasterSetError(error: unknown, message: string): Error {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === 'string') {
    return new Error(error);
  }
  return new Error(message);
}

/** Returns true when an error came from an aborted request. */
function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}
