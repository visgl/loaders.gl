// TODO - this should move to core when test cases are more complete

import {Stats} from '@probe.gl/stats';

const STAT_QUEUED_REQUESTS = 'Queued Requests';
const STAT_ACTIVE_REQUESTS = 'Active Requests';
const STAT_CANCELLED_REQUESTS = 'Cancelled Requests';
const STAT_QUEUED_REQUESTS_EVER = 'Queued Requests Ever';
const STAT_ACTIVE_REQUESTS_EVER = 'Active Requests Ever';

const DEFAULT_PROPS = {
  id: 'request-scheduler',
  // Specifies if the request scheduler should throttle incoming requests, mainly for comparative testing
  throttleRequests: true,
  // The maximum number of simultaneous active requests. Un-throttled requests do not observe this limit.
  maxRequests: 6
};

// TODO - Track requests globally, across multiple servers
export default class RequestScheduler {
  constructor(props = {}) {
    this.props = {...DEFAULT_PROPS, ...props};

    // Tracks the number of active requests and prioritizes/cancels queued requests.
    this.requestQueue = [];
    this.activeRequestCount = 0;
    this.requestMap = new Map();

    // Returns the statistics used by the request scheduler.
    this.stats = new Stats({id: props.id});
    this.stats.get(STAT_QUEUED_REQUESTS);
    this.stats.get(STAT_ACTIVE_REQUESTS);
    this.stats.get(STAT_CANCELLED_REQUESTS);
    this.stats.get(STAT_QUEUED_REQUESTS_EVER);
    this.stats.get(STAT_ACTIVE_REQUESTS_EVER);

    this._deferredUpdate = null;
  }

  // Called by an application that wants to issue a request, without having it deeply queued
  // Parameter `getPriority` will be called when request "slots" open up,
  //    allowing the caller to update priority or cancel the request
  //    Highest priority executes first, priority < 0 cancels the request
  // Returns: a promise that resolves to a request token when the request can be issued without queueing,
  //    or `false` if the request has been cancelled (by getPriority)
  scheduleRequest(handle, getPriority = () => 0) {
    // Allows throttling to be disabled
    if (!this.props.throttleRequests) {
      return Promise.resolve({done: () => {}});
    }

    // dedupe
    if (this.requestMap.has(handle)) {
      return this.requestMap.get(handle);
    }

    const request = {handle, getPriority};
    const promise = new Promise(resolve => {
      request.resolve = resolve;
      return request;
    });

    this.requestQueue.push(request);
    this.requestMap.set(handle, promise);
    this._issueNewRequests();
    return promise;
  }

  // PRIVATE

  _issueRequest(request) {
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

  // We check requests asynchronously, to prevent multiple updates
  _issueNewRequests() {
    if (!this._deferredUpdate) {
      this._deferredUpdate = setTimeout(() => this._issueNewRequestsAsync(), 0);
    }
  }

  // Refresh all requests and
  _issueNewRequestsAsync() {
    this._deferredUpdate = null;

    const freeSlots = Math.max(this.props.maxRequests - this.activeRequestCount, 0);

    if (freeSlots === 0) {
      return;
    }

    this._updateAllRequests();

    // Resolve pending promises for the top-priority requests
    for (let i = 0; i < freeSlots; ++i) {
      if (this.requestQueue.length > 0) {
        const request = this.requestQueue.shift();
        this._issueRequest(request);
      }
    }

    // Uncomment to debug
    // console.log(`${freeSlots} free slots, ${this.requestQueue.length} queued requests`);
  }

  // Ensure all requests have updated priorities, and that no longer valid requests are cancelled
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

  // Update a single request by calling the callback
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
