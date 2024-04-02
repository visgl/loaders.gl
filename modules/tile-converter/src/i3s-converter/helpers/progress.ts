import process from 'process';
import {timeConverter} from '../../lib/utils/statistic-utills';

/** Defines a threshold that is used to check if the process velocity can be consifered trust. */
const THRESHOLD_DEFAULT = 0.2;

/**
 * Implements methods to keep track on the progress of a long process.
 */
export class Progress {
  /** Total amount of work, e.g. number of files to save or number of bytes to send */
  private _stepsTotal: number = 0;
  /** Amount of work already done */
  private _stepsDone: number = 0;
  /** Time in milli-seconds when the process started */
  private startTime: number = 0;
  /** Time in milli-seconds when the process stopped */
  private stopTime: number = 0;
  /** Time in milli-seconds when stepsDone was updated */
  private timeOfUpdatingStepsDone: number = 0;
  /** Time in milli-seconds spent for performing one step*/
  private milliSecForOneStep: number = 0;
  private trust: boolean = false;
  /**
   * The number of digits to appear after decimal point in the string representation of the count of steps already done.
   * It's calculated based on the total count of steps.
   */
  private numberOfDigitsInPercentage: number = 0;
  /** Defines a threshold that is used to check if the process velocity can be consifered trust. */
  private threshold: number;
  /** Function that is used to get the time stamp */
  private getTime: () => bigint;

  constructor(options: {threshold?: number; getTime?: () => bigint} = {}) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    this.getTime = options.getTime || process.hrtime.bigint;
    this.threshold = options.threshold || THRESHOLD_DEFAULT;
  }

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
    this.timeOfUpdatingStepsDone = this.getCurrentTimeInMilliSeconds();
    if (this._stepsDone) {
      const diff = this.timeOfUpdatingStepsDone - this.startTime;
      const milliSecForOneStep = diff / this._stepsDone;

      this.trust = this.isVelocityTrust(milliSecForOneStep, this.milliSecForOneStep);
      this.milliSecForOneStep = milliSecForOneStep;
    }
  }

  /**
   * Saves the current time as we start monitoring the process.
   */
  startMonitoring() {
    this.startTime = this.getCurrentTimeInMilliSeconds();
    this.milliSecForOneStep = 0;
    this.trust = false;
    this.timeOfUpdatingStepsDone = 0;
    this.stopTime = 0;
    this.stepsDone = 0;
  }

  /**
   * Saves the current time as we stop monitoring the process.
   */
  stopMonitoring() {
    this.stopTime = this.getCurrentTimeInMilliSeconds();
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
   * @returns string representation of percentage or an empty string if the percetage value cannot be calculated.
   */
  getPercentString() {
    const percent = this.getPercent();
    return percent !== null ? percent.toFixed(this.numberOfDigitsInPercentage) : '';
  }

  /**
   * Gets the time elapsed since the monitoring started
   * @returns Number of milliseconds elapsed
   */
  getTimeCurrentlyElapsed(): number {
    const currentTime = this.stopTime ? this.stopTime : this.getCurrentTimeInMilliSeconds();
    const diff = currentTime - this.startTime;
    return diff;
  }

  /**
   * Gets the time remaining (expected at the moment of updating 'stepsDone') to complete the work.
   * @returns Number of milliseconds remaining
   */
  getTimeRemaining(): {timeRemaining: number; trust: boolean} | null {
    if (!this._stepsTotal || !this._stepsDone || !this.startTime) {
      return null;
    }

    const timeRemainingInMilliSeconds =
      (this._stepsTotal - this._stepsDone) * this.milliSecForOneStep;
    return {timeRemaining: timeRemainingInMilliSeconds, trust: this.trust};
  }

  /**
   * Gets the string representation of the time remaining (expected at the moment of updating 'stepsDone') to complete the work.
   * @returns string representation of the time remaining.
   * It's an empty string if the time cannot be pedicted or it's still being calculated.
   */
  getTimeRemainingString(): string {
    const timeRemainingObject = this.getTimeRemaining();
    return timeRemainingObject?.trust ? timeConverter(timeRemainingObject.timeRemaining) : '';
  }

  /**
   * Check if the computed velociy of the process can be considered trust.
   * At the beginning of the process the number of samples collected ('time necessary to perform one step' averaged) is too small,
   * which results in huge deviation of the cumputed velocity of the process.
   * It makes sense to perform the check before reporting the time remainig so the end user is not confused.
   * @param current - current value
   * @param previous - previous value
   * @returns true if the computed velociy can be considered trust, or false otherwise
   */
  private isVelocityTrust(current: number, previous: number): boolean {
    if (previous) {
      const dev = Math.abs((current - previous) / previous);
      return dev < this.threshold;
    }
    return false;
  }

  /**
   * Gets current time in milliseconds.
   * @returns current time in milliseconds.
   */
  private getCurrentTimeInMilliSeconds(): number {
    // process.hrtime.bigint() returns the time in nanoseconds. We need the time in milliseconds.
    return Number(this.getTime() / BigInt(1e6));
  }
}
