import process from 'process';

/** Defines a threshold that is used to check if the process velocity can be consifered trust. */
const THRESHOLD = 1.2;

/**
 * Implements methods to keep track on the progress of a long process.
 */
export class Progress {
  /** Total amount of work, e.g. number of files to save or number of bytes to send */
  private _stepsTotal: number = 0;
  /** Amount of work already done */
  private _stepsDone: number = 0;
  /** Time in nano-seconds when the process started */
  private startTime: number = 0;
  /** Time in nano-seconds when the process stopped */
  private stopTime: number = 0;
  /** Time in nano-seconds spent for performing */
  private milliSecForOneItem: number = 0;
  /**
   * The number of digits to appear after decimal point in the string representation of the count of steps already done.
   * It's calculated based on the total count of steps.
   */
  private numberOfDigitsInPercentage: number = 0;

  constructor() {}

  /** Total amount of work, e.g. number of files to save or number of bytes to send */
  get stepsTotal() {
    return this._stepsTotal;
  }

  set stepsTotal(stepsTotal) {
    this._stepsTotal = stepsTotal;
    this.numberOfDigitsInPercentage =
      this.stepsTotal > 100 ? Math.ceil(Math.log10(this.stepsTotal)) - 2 : 0;
  }

  /** Amount of work already done */
  get stepsDone() {
    return this._stepsDone;
  }

  set stepsDone(stepsDone) {
    this._stepsDone = stepsDone;
  }

  /**
   * Saves the current time as we start monitoring the process.
   */
  startMonitoring() {
    this.startTime = getCurrentTimeInMilliSec();
    this.stopTime = 0;
  }

  /**
   * Saves the current time as we stop monitoring the process.
   */
  stopMonitoring() {
    this.stopTime = getCurrentTimeInMilliSec();
  }

  /**
   * Gets percentage of the work already done.
   * @returns percentage of the work already done.
   */
  getPercent(): number | null {
    if (!this._stepsTotal) {
      return null;
    }
    const percent = (this._stepsDone / this._stepsTotal) * 100.0;
    return percent;
  }

  /**
   * Gets string representation of percentage of the work already done.
   * @returns string representation of percentage
   */
  getPercentString() {
    const percent = this.getPercent();
    return percent !== null ? percent.toFixed(this.numberOfDigitsInPercentage) : '';
  }

  /**
   * Gets the time elapsed since the monitoring started
   * @returns Number of seconds elapsed
   */
  getTimeElapsed(): number {
    const currentTime = this.stopTime ? this.stopTime : getCurrentTimeInMilliSec();
    const diff = currentTime - this.startTime;
    return Number(diff / 1e3);
  }

  /**
   * Gets the time presumably remaining to complete the work
   * @returns Number of seconds remaining
   */
  getTimeRemaining(): {timeRemaining: number; trust: boolean} | null {
    if (!this._stepsDone || !this.startTime) {
      return null;
    }
    const currentTime = this.stopTime ? this.stopTime : getCurrentTimeInMilliSec();
    const diff = currentTime - this.startTime;

    const milliSecForOneItem = diff / this._stepsDone;

    const trust = this.isVelocityTrust(milliSecForOneItem, this.milliSecForOneItem);
    this.milliSecForOneItem = milliSecForOneItem;

    const timeRemainingInSeconds =
      ((this._stepsTotal - this._stepsDone) * milliSecForOneItem) / 1e3;
    return {timeRemaining: Number(timeRemainingInSeconds), trust: trust};
  }

  /**
   * Check if the computed velociy of the process can be considered trust.
   * At the beginning of the process the number of samples collected ('time necessary to process one item' averaged) is too small,
   * which results in huge deviation of the cumputed velocity of the process.
   * It makes sense to perform the check before reporting the time remainig so the end user is not confused.
   *
   * @param current - current value
   * @param previous - previous value
   * @returns true if the computed velociy can be considered trust, or false otherwise
   */
  private isVelocityTrust(current: number, previous: number): boolean {
    if (previous) {
      const dev = Math.abs(Number((current - previous) / previous));
      return dev < THRESHOLD;
    }
    return false;
  }
}

/**
 * Gets current time in milliseconds.
 * @returns current time in milliseconds.
 */
function getCurrentTimeInMilliSec(): number {
  // process.hrtime.bigint() returns the time in nanoseconds. We need the time in milliseconds.
  return Number(process.hrtime.bigint() / BigInt(1e6));
}
