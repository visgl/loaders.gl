import {FrameState} from '../helpers/frame-state';
import FrameCounter from './i3s-frame-counter';

const STATUS = {
  REQUESTED: 'REQUESTED',
  COMPLETED: 'COMPLETED',
  ERROR: 'ERROR'
};

// A helper class to manage tile metadata fetching
export default class I3STileManager {
  private _statusMap: object;
  private frameCounter = new FrameCounter();

  constructor() {
    this._statusMap = {};
  }

  add(request, key, callback, frameState: FrameState) {
    if (!this._statusMap[key]) {
      const {frameNumber} = frameState;
      this._statusMap[key] = {request, callback, key, frameState, status: STATUS.REQUESTED};
      this.frameCounter.increase(frameNumber);
      request()
        .then((data) => {
          this._statusMap[key].status = STATUS.COMPLETED;
          this.frameCounter.decrease(frameNumber);
          this._statusMap[key].callback(data, frameState);
        })
        .catch((error) => {
          this._statusMap[key].status = STATUS.ERROR;
          this.frameCounter.decrease(frameNumber);
          callback(error);
        });
    }
  }

  update(key, frameState: FrameState) {
    if (this._statusMap[key]) {
      this.frameCounter.decrease(this._statusMap[key].frameState.frameNumber);
      this.frameCounter.increase(frameState.frameNumber);
      this._statusMap[key].frameState = frameState;
    }
  }

  find(key) {
    return this._statusMap[key];
  }

  hasWithFrameState(frameNumber): boolean {
    return !this.frameCounter.isZero(frameNumber);
  }
}
