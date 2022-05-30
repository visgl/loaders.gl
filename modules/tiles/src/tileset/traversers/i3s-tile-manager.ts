import {FrameState} from '../helpers/frame-state';
import I3SPendingTilesRegister from './i3s-frame-counter';

const STATUS = {
  REQUESTED: 'REQUESTED',
  COMPLETED: 'COMPLETED',
  ERROR: 'ERROR'
};

// A helper class to manage tile metadata fetching
export default class I3STileManager {
  private _statusMap: object;
  private pendingTilesRegister = new I3SPendingTilesRegister();

  constructor() {
    this._statusMap = {};
  }

  add(request, key, callback, frameState: FrameState) {
    if (!this._statusMap[key]) {
      const {frameNumber} = frameState;
      this._statusMap[key] = {request, callback, key, frameState, status: STATUS.REQUESTED};
      // Register pending request for the frameNumber
      this.pendingTilesRegister.register(frameNumber);
      request()
        .then((data) => {
          this._statusMap[key].status = STATUS.COMPLETED;
          const {frameNumber: actualFrameNumber} = this._statusMap[key].frameState;
          // Deregister pending request for the frameNumber
          this.pendingTilesRegister.deregister(actualFrameNumber);
          this._statusMap[key].callback(data, frameState);
        })
        .catch((error) => {
          this._statusMap[key].status = STATUS.ERROR;
          const {frameNumber: actualFrameNumber} = this._statusMap[key].frameState;
          // Deregister pending request for the frameNumber
          this.pendingTilesRegister.deregister(actualFrameNumber);
          callback(error);
        });
    }
  }

  update(key, frameState: FrameState) {
    if (this._statusMap[key]) {
      // Deregister pending request for the old frameNumber
      this.pendingTilesRegister.deregister(this._statusMap[key].frameState.frameNumber);
      // Register pending request for the new frameNumber
      this.pendingTilesRegister.register(frameState.frameNumber);
      this._statusMap[key].frameState = frameState;
    }
  }

  find(key) {
    return this._statusMap[key];
  }

  /**
   * Check it there are pending tile headers for the particular frameNumber
   * @param frameNumber
   * @returns
   */
  hasPendingTiles(frameNumber: number): boolean {
    return !this.pendingTilesRegister.isZero(frameNumber);
  }
}
