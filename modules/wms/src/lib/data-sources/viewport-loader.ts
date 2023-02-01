// loaders.gl, MIT license

import {ImageType} from '@loaders.gl/images';
import {RequestScheduler} from '@loaders.gl/loader-utils';

export type LoadableViewport = {
  id: string;
  width: number;
  height: number;
  bounds: [number, number, number, number];
};

export type ViewportLoaderProps<DataType = unknown> = {
  id?: string;
  viewports?: LoadableViewport[];
  debounce?: number;
  requestScheduler?: RequestScheduler;

  onLoadViewport: (viewport: LoadableViewport) => DataType;
  onViewportLoad: (viewport: LoadableViewport, data: DataType) => void;
  onViewportUnload?: (viewport: LoadableViewport, data: DataType) => void;
  // possible additional callbacks
  // onViewportRemoved: (viewport: LoadableViewport)
  // onViewportAdded: (viewport: LoadableViewport)
  // onAllViewportsLoaded:
};

type ViewportData<DataType> = {
  bounds: [number, number, number, number];
  data: DataType;
};

export class ViewportLoader<DataType = ImageType> {
  props: ViewportLoaderProps;
  requestScheduler: RequestScheduler;
  viewports: LoadableViewport[] = [];
  loadedData: Record<string, ViewportData<DataType>> = {};
  loadPromises: Record<string, Promise<any>> = {};

  constructor(props: ViewportLoaderProps) {
    this.props = props;
    this.requestScheduler = props.requestScheduler || new RequestScheduler({});
    this.setViewports(props.viewports || []);
  }

  setViewports(viewports: LoadableViewport[]): void {
    // Drop any loadedData that are no longer relevant
    for (const viewportId of Object.keys(this.loadedData)) {
      if (!(viewportId in this.loadedData)) {
        const loadedData = this.loadedData[viewportId];
        delete this.loadedData[viewportId];
        delete this.loadPromises[viewportId];
        this.props.onViewportUnload?.(this.viewports[viewportId], loadedData);
      }
    }

    for (const viewport of viewports) {
      if (!this._viewportEqual(viewport, this.viewports[viewport.id])) {
        this.loadPromises[viewport.id] = Promise.resolve(this.props.onLoadViewport(viewport));
        this.loadPromises[viewport.id].then((data) => {
          this.loadedData[viewport.id] = data;
          delete this.loadPromises[viewport.id];
          this.props.onViewportLoad(viewport, data);
        });
      }
    }
  }

  /** returns the data that is available right now */
  getDataForViewport(viewportId: string): DataType | null {
    const loadedData = this.loadedData[viewportId];
    return loadedData ? loadedData.data : null;
  }

  /** Compare 2 viewports (TODO - use EPSILON) */
  protected _viewportEqual(viewport1: LoadableViewport, viewport2: LoadableViewport): boolean {
    if (viewport1 !== viewport2) {
      return false;
    }
    if (viewport1.id !== viewport2.id) {
      return false;
    }
    if (viewport1.width !== viewport2.width || viewport1.height !== viewport2.height) {
      return false;
    }
    return viewport1.bounds.every((bound, i) => bound === viewport2.bounds[i]);
  }
}
