import {Stats} from '@probe.gl/stats';

type Handle = any;
type DoneFunction = () => any;
type GetPriorityFunction = () => number;
type RequestResult = {
  done: DoneFunction;
} | null;

/** RequestScheduler Options */
export type RequestSchedulerProps = {
  id?: string;
  throttleRequests?: boolean;
  maxRequests?: number;
};

const STAT_QUEUED_REQUESTS = 'Queued Requests';
const STAT_ACTIVE_REQUESTS = 'Active Requests';
const STAT_CANCELLED_REQUESTS = 'Cancelled Requests';
const STAT_QUEUED_REQUESTS_EVER = 'Queued Requests Ever';
const STAT_ACTIVE_REQUESTS_EVER = 'Active Requests Ever';

const DEFAULT_PROPS: Required<RequestSchedulerProps> = {
  id: 'request-scheduler',
  // Specifies if the request scheduler should throttle incoming requests, mainly for comparative testing
  throttleRequests: true,
  // The maximum number of simultaneous active requests. Un-throttled requests do not observe this limit.
  maxRequests: 6
};

/** Tracks one request */
type Request = {
  handle: Handle;
  priority: number;
  getPriority: GetPriorityFunction;
  resolve?: (value: any) => any;
};

/**
 * Used to issue a request, without having them "deeply queued" by the browser.
 * @todo - Track requests globally, across multiple servers
 */
export default class RequestScheduler {
  readonly props: Required<RequestSchedulerProps>;
  readonly stats: Stats;
  activeRequestCount: number = 0;

  /** Tracks the number of active requests and prioritizes/cancels queued requests. */
  private requestQueue: Request[] = [];
  private requestMap: Map<Handle, Promise<RequestResult>> = new Map();
  private deferredUpdate: any = null;

  constructor(props: RequestSchedulerProps = {}) {
    this.props = {...DEFAULT_PROPS, ...props};

    // Returns the statistics used by the request scheduler.
    this.stats = new Stats({id: this.props.id});
    this.stats.get(STAT_QUEUED_REQUESTS);
    this.stats.get(STAT_ACTIVE_REQUESTS);
    this.stats.get(STAT_CANCELLED_REQUESTS);
    this.stats.get(STAT_QUEUED_REQUESTS_EVER);
    this.stats.get(STAT_ACTIVE_REQUESTS_EVER);
  }

  /**
   * Called by an application that wants to issue a request, without having it deeply queued by the browser
   *
   * When the returned promise resolved, it is OK for the application to issue a request.
   * The promise resolves to an object that contains a `done` method.
   * When the application's request has completed (or failed), the application must call the `done` function
   *
   * @param handle
   * @param getPriority will be called when request "slots" open up,
   *    allowing the caller to update priority or cancel the request
   *    Highest priority executes first, priority < 0 cancels the request
   * @returns a promise
   *   - resolves to a object (with a `done` field) when the request can be issued without queueing,
   *   - resolves to `null` if the request has been cancelled (by the callback return < 0).
   *     In this case the application should not issue the request
   */
  scheduleRequest(
    handle: Handle,
    getPriority: GetPriorityFunction = () => 0
  ): Promise<RequestResult> {
    // Allows throttling to be disabled
    if (!this.props.throttleRequests) {
      return Promise.resolve({done: () => {}});
    }

    // dedupe
    if (this.requestMap.has(handle)) {
      return this.requestMap.get(handle) as Promise<any>;
    }

    const request: Request = {handle, priority: 0, getPriority};
    const promise = new Promise<RequestResult>((resolve) => {
      // @ts-ignore
      request.resolve = resolve;
      return request;
    });

    this.requestQueue.push(request);
    this.requestMap.set(handle, promise);
    this._issueNewRequests();
    return promise;
  }

  // PRIVATE

  _issueRequest(request: Request): Promise<any> {
    const {handle, resolve} = request;
    let isDone = false;

    const done = () => {
      // can only be called once
      if (!isDone) {
        isDone = true;

        // Stop tracking a request - it has completed, failed, cancelled etc
        this.requestMap.delete(handle);
        this.activeRequestCount--;
        // A slot just freed up, see if any queued requests are waiting
        this._issueNewRequests();
      }
    };

    // Track this request
    this.activeRequestCount++;

    return resolve ? resolve({done}) : Promise.resolve({done});
  }

  /** We check requests asynchronously, to prevent multiple updates */
  _issueNewRequests(): void {
    if (!this.deferredUpdate) {
      this.deferredUpdate = setTimeout(() => this._issueNewRequestsAsync(), 0);
    }
  }

  /** Refresh all requests  */
  _issueNewRequestsAsync() {
    // TODO - shouldn't we clear the timeout?
    this.deferredUpdate = null;

    const freeSlots = Math.max(this.props.maxRequests - this.activeRequestCount, 0);

    if (freeSlots === 0) {
      return;
    }

    this._updateAllRequests();

    // Resolve pending promises for the top-priority requests
    for (let i = 0; i < freeSlots; ++i) {
      const request = this.requestQueue.shift();
      if (request) {
        this._issueRequest(request); // eslint-disable-line @typescript-eslint/no-floating-promises
      }
    }

    // Uncomment to debug
    // console.log(`${freeSlots} free slots, ${this.requestQueue.length} queued requests`);
  }

  /** Ensure all requests have updated priorities, and that no longer valid requests are cancelled */
  _updateAllRequests() {
    const requestQueue = this.requestQueue;
    for (let i = 0; i < requestQueue.length; ++i) {
      const request = requestQueue[i];
      if (!this._updateRequest(request)) {
        // Remove the element and make sure to adjust the counter to account for shortened array
        requestQueue.splice(i, 1);
        this.requestMap.delete(request.handle);
        i--;
      }
    }

    // Sort the remaining requests based on priority
    requestQueue.sort((a, b) => a.priority - b.priority);
  }

  /** Update a single request by calling the callback */
  _updateRequest(request) {
    request.priority = request.getPriority(request.handle); // eslint-disable-line callback-return

    // by returning a negative priority, the callback cancels the request
    if (request.priority < 0) {
      request.resolve(null);
      return false;
    }
    return true;
  }
}
