// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  GetImageParameters,
  ImageSource,
  ImageSourceMetadata,
  ImageType
} from '@loaders.gl/loader-utils';

/** Accepted image request currently retained by {@link ImageSet}. */
export type ImageSetRequest<DataT = ImageType> = {
  /** Unique request id assigned by the manager. */
  requestId: number;
  /** Image request parameters that produced the accepted image. */
  parameters: GetImageParameters;
  /** Image retained as the current output. */
  image: DataT;
};

/** Configuration shared by all {@link ImageSet} instances. */
export type ImageSetBaseProps<DataT = ImageType> = {
  /** Callback used to load source metadata. */
  getMetadata: () => Promise<ImageSourceMetadata>;
  /** Callback used to load an image for a viewport-derived request. */
  getImage: (parameters: GetImageParameters) => Promise<DataT>;
  /** Debounce interval applied before issuing image requests. */
  debounceTime?: number;
};

/** Options for creating an {@link ImageSet}. */
export type ImageSetProps<DataT = ImageType> = Partial<ImageSetBaseProps<DataT>> & {
  /** Optional loaders.gl image source backing this manager. */
  imageSource?: ImageSource | null;
};

/** Subscription callbacks emitted by {@link ImageSet}. */
export type ImageSetListener<DataT = ImageType> = {
  /** Fired when metadata/image loading starts or stops. */
  onLoadingStateChange?: (isLoading: boolean) => void;
  /** Fired when source metadata resolves successfully. */
  onMetadataLoad?: (metadata: ImageSourceMetadata) => void;
  /** Fired when metadata loading fails. */
  onMetadataLoadError?: (error: Error) => void;
  /** Fired when a new image request is issued. */
  onImageLoadStart?: (requestId: number, parameters: GetImageParameters) => void;
  /** Fired when an image request resolves and becomes current. */
  onImageLoad?: (request: ImageSetRequest<DataT>) => void;
  /** Fired when an image request fails. */
  onImageLoadError?: (requestId: number, error: Error, parameters: GetImageParameters) => void;
  /** Fired when metadata or the current image changes. */
  onUpdate?: () => void;
};

const DEFAULT_IMAGESET_PROPS: Required<Omit<ImageSetProps, 'imageSource'>> = {
  getMetadata: async () => ({name: '', keywords: [], layers: []}),
  getImage: async () => null as never,
  debounceTime: 0
};

/** Shared image request manager used by source-backed image layers. */
export class ImageSet<DataT = ImageType> {
  /** Cached metadata returned by the backing source, if any. */
  metadata: ImageSourceMetadata | null = null;

  private _opts: Required<ImageSetProps<DataT>>;
  private _listeners = new Set<ImageSetListener<DataT>>();
  private _currentRequest: ImageSetRequest<DataT> | null = null;
  private _lastAcceptedRequestId = -1;
  private _nextRequestId = 0;
  private _loadCounter = 0;
  private _timeoutId: ReturnType<typeof setTimeout> | null = null;
  private _abortController: AbortController | null = null;
  private _finalized = false;

  /** Creates an image manager from a source or direct callbacks. */
  constructor(opts: ImageSetProps<DataT>) {
    this._opts = this._normalizeOptions(opts);
    if (!this._opts.imageSource && (!opts.getImage || !opts.getMetadata)) {
      throw new Error('ImageSet requires either `imageSource` or both `getImage` and `getMetadata`.');
    }
  }

  /** Convenience factory for wrapping a loaders.gl {@link ImageSource}. */
  static fromImageSource<DataT = ImageType>(
    imageSource: ImageSource,
    opts: Omit<ImageSetProps<DataT>, 'imageSource' | 'getImage' | 'getMetadata'> = {}
  ): ImageSet<DataT> {
    return new ImageSet<DataT>({...opts, imageSource});
  }

  /** Whether the manager has no requests in flight and a current image. */
  get isLoaded(): boolean {
    return this._loadCounter === 0 && Boolean(this._currentRequest);
  }

  /** Current accepted image, if any. */
  get image(): DataT | null {
    return this._currentRequest?.image || null;
  }

  /** Current accepted request and image payload, if any. */
  get currentRequest(): ImageSetRequest<DataT> | null {
    return this._currentRequest;
  }

  /** Backing image source when constructed from one. */
  get imageSource(): ImageSource | null {
    return this._opts.imageSource;
  }

  /** Subscribes to metadata and image lifecycle events. */
  subscribe(listener: ImageSetListener<DataT>): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /** Updates source callbacks or debounce settings, resetting state when the source changes. */
  setOptions(opts: ImageSetProps<DataT>): void {
    const previousImageSource = this._opts.imageSource;
    const nextOptions = this._normalizeOptions({...this._opts, ...opts});
    const sourceChanged =
      previousImageSource !== nextOptions.imageSource ||
      this._opts.getImage !== nextOptions.getImage ||
      this._opts.getMetadata !== nextOptions.getMetadata;

    this._opts = nextOptions;

    if (sourceChanged) {
      this._cancelScheduledImage();
      this.metadata = null;
      this._currentRequest = null;
      this._lastAcceptedRequestId = -1;
      this._nextRequestId = 0;
      this._emitUpdate();
    }
  }

  /** Loads metadata from the current image source or callbacks. */
  async loadMetadata(): Promise<ImageSourceMetadata> {
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
      const normalizedError = normalizeImageSetError(error, 'Image metadata request failed');
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

  /** Debounces and issues a new image request for the supplied parameters. */
  requestImage(parameters: GetImageParameters, debounceTime = this._opts.debounceTime): number {
    const requestId = this._nextRequestId++;
    this._cancelScheduledImage();
    this._abortActiveRequest();

    if (debounceTime > 0) {
      this._timeoutId = setTimeout(() => {
        this._timeoutId = null;
        void this._loadImage(requestId, parameters);
      }, debounceTime);
    } else {
      void this._loadImage(requestId, parameters);
    }

    return requestId;
  }

  /** Clears timers and listeners held by the manager. */
  finalize(): void {
    this._finalized = true;
    this._cancelScheduledImage();
    this._abortActiveRequest();
    this._listeners.clear();
  }

  /** Loads an image immediately and accepts it only if it is the newest completed request. */
  private async _loadImage(requestId: number, parameters: GetImageParameters): Promise<void> {
    if (this._finalized) {
      return;
    }

    this._startLoading();
    for (const listener of this._listeners) {
      listener.onImageLoadStart?.(requestId, parameters);
    }

    try {
      const abortController = new AbortController();
      this._abortController = abortController;
      const image = await this._opts.getImage({...parameters, signal: abortController.signal});
      if (this._finalized || requestId <= this._lastAcceptedRequestId) {
        return;
      }

      this._lastAcceptedRequestId = requestId;
      this._currentRequest = {requestId, parameters, image};

      for (const listener of this._listeners) {
        listener.onImageLoad?.(this._currentRequest);
      }
      this._emitUpdate();
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }
      const normalizedError = normalizeImageSetError(error, 'Image request failed');
      if (!this._finalized) {
        for (const listener of this._listeners) {
          listener.onImageLoadError?.(requestId, normalizedError, parameters);
        }
      }
    } finally {
      if (this._abortController?.signal === parameters.signal) {
        this._abortController = null;
      }
      this._finishLoading();
    }
  }

  /** Resolves current options from either a source or direct callbacks. */
  private _normalizeOptions(opts: ImageSetProps<DataT>): Required<ImageSetProps<DataT>> {
    const imageSource = opts.imageSource || null;
    return {
      ...DEFAULT_IMAGESET_PROPS,
      ...opts,
      imageSource,
      getMetadata:
        opts.getMetadata ||
        (() => {
          if (imageSource) {
            return imageSource.getMetadata();
          }
          return DEFAULT_IMAGESET_PROPS.getMetadata();
        }),
      getImage:
        opts.getImage ||
        ((parameters: GetImageParameters) => {
          if (imageSource) {
            return imageSource.getImage(parameters) as Promise<DataT>;
          }
          return DEFAULT_IMAGESET_PROPS.getImage(parameters) as Promise<DataT>;
        }),
      debounceTime: opts.debounceTime ?? DEFAULT_IMAGESET_PROPS.debounceTime
    };
  }

  /** Notifies listeners that current metadata or image output changed. */
  private _emitUpdate(): void {
    for (const listener of this._listeners) {
      listener.onUpdate?.();
    }
  }

  /** Increments the active load count and emits loading changes. */
  private _startLoading(): void {
    const wasLoading = this._loadCounter > 0;
    this._loadCounter++;
    if (!wasLoading) {
      this._emitLoadingStateChange(true);
      this._emitUpdate();
    }
  }

  /** Decrements the active load count and emits loading changes. */
  private _finishLoading(): void {
    const wasLoading = this._loadCounter > 0;
    this._loadCounter = Math.max(0, this._loadCounter - 1);
    if (wasLoading && this._loadCounter === 0) {
      this._emitLoadingStateChange(false);
      this._emitUpdate();
    }
  }

  /** Notifies listeners when the overall loading state changes. */
  private _emitLoadingStateChange(isLoading: boolean): void {
    for (const listener of this._listeners) {
      listener.onLoadingStateChange?.(isLoading);
    }
  }

  /** Clears any pending debounced image request. */
  private _cancelScheduledImage(): void {
    if (this._timeoutId !== null) {
      clearTimeout(this._timeoutId);
      this._timeoutId = null;
    }
  }

  /** Aborts the current in-flight image request, if any. */
  private _abortActiveRequest(): void {
    this._abortController?.abort();
    this._abortController = null;
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

/** Normalizes arbitrary thrown values to `Error` instances for bookkeeping. */
function normalizeImageSetError(error: unknown, message: string): Error {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === 'string') {
    return new Error(error);
  }
  return new Error(message);
}
