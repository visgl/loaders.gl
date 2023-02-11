import {FrameState} from '../helpers/frame-state';
import {I3SPendingTilesRegister} from './i3s-pending-tiles-register';

const STATUS = {
  REQUESTED: 'REQUESTED',
  COMPLETED: 'COMPLETED',
  ERROR: 'ERROR'
};

// A helper class to manage tile metadata fetching
export class I3STileManager {
  private _statusMap: object;
  private pendingTilesRegister = new I3SPendingTilesRegister();

  constructor() {
    this._statusMap = {};
  }

  /**
   * Add request to map
   * @param request - node metadata request
   * @param key - unique key
   * @param callback - callback after request completed
   * @param frameState - frameState data
   */
  add(request, key, callback, frameState: FrameState) {
    if (!this._statusMap[key]) {
      const {
        frameNumber,
        viewport: {id}
      } = frameState;
      this._statusMap[key] = {request, callback, key, frameState, status: STATUS.REQUESTED};
      // Register pending request for the frameNumber
      this.pendingTilesRegister.register(id, frameNumber);
      request()
        .then((data) => {
          this._statusMap[key].status = STATUS.COMPLETED;
          const {
            frameNumber: actualFrameNumber,
            viewport: {id}
          } = this._statusMap[key].frameState;
          // Deregister pending request for the frameNumber
          this.pendingTilesRegister.deregister(id, actualFrameNumber);
          this._statusMap[key].callback(data, frameState);
        })
        .catch((error) => {
          this._statusMap[key].status = STATUS.ERROR;
          const {
            frameNumber: actualFrameNumber,
            viewport: {id}
          } = this._statusMap[key].frameState;
          // Deregister pending request for the frameNumber
          this.pendingTilesRegister.deregister(id, actualFrameNumber);
          callback(error);
        });
    }
  }

  /**
   * Update request if it is still actual for the new frameState
   * @param key - unique key
   * @param frameState - frameState data
   */
  update(key, frameState: FrameState) {
    if (this._statusMap[key]) {
      // Deregister pending request for the old frameNumber
      const {
        frameNumber,
        viewport: {id}
      } = this._statusMap[key].frameState;
      this.pendingTilesRegister.deregister(id, frameNumber);

      // Register pending request for the new frameNumber
      const {
        frameNumber: newFrameNumber,
        viewport: {id: newViewportId}
      } = frameState;
      this.pendingTilesRegister.register(newViewportId, newFrameNumber);
      this._statusMap[key].frameState = frameState;
    }
  }

  /**
   * Find request in the map
   * @param key - unique key
   * @returns
   */
  find(key) {
    return this._statusMap[key];
  }

  /**
   * Check it there are pending tile headers for the particular frameNumber
   * @param viewportId
   * @param frameNumber
   * @returns
   */
  hasPendingTiles(viewportId: string, frameNumber: number): boolean {
    return !this.pendingTilesRegister.isZero(viewportId, frameNumber);
  }
}
