// TODO - this should move to core when test cases are more complete

/* global setTimeout */
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

// The request scheduler does not actually issue requests, it just lets apps know
// when the request can be issued without overwhelming the server.
// The main use case is to let the app reprioritize or cancel requests if
//  circumstances change before the request can be scheduled.
//
// TODO - Track requests globally, across multiple servers
export default class RequestScheduler {
  constructor(props = {}) {
    this.props = {...DEFAULT_PROPS, ...props};

    // Tracks the number of active requests and prioritizes/cancels queued requests.
    this.requestQueue = [];
    this.activeRequestCount = 0;
    this.requestMap = {};

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
  // Parameter `callback` will be called when request "slots" open up,
  //    allowing the caller to update priority or cancel the request
  //    Highest priority executes first, priority < 0 cancels the request
  // Returns: a promise that resolves when the request can be issued without queueing,
  //    or rejects if the request has been cancelled (by the callback)
  scheduleRequest(handle, callback = () => 0) {
    // Allows throttling to be disabled
    if (!this.props.throttleRequests) {
      return Promise.resolve(handle);
    }

    // dedupe
    if (this.requestMap[handle.id]) {
      return this.requestMap[handle.id];
    }

    let request = null;
    const promise = new Promise((resolve, reject) => {
      request = {handle, callback, resolve, reject};
      return request;
    });

    // TODO - error, request is not defined?
    // @ts-ignore
    this.requestQueue.push({promise, ...request});
    this.requestMap[handle.id] = promise;
    this._issueNewRequests();
    return promise;
  }

  // Called by an application to mark that it is actively making a request
  startRequest(handle) {
    this.activeRequestCount++;
  }

  // Called by an application to mark that it is finished making a request
  endRequest(handle) {
    if (this.requestMap[handle.id]) {
      delete this.requestMap[handle.id];
    }
    this.activeRequestCount--;
    this._issueNewRequests();
  }

  // Tracks a request promise, starting and then ending the request (triggering new slots).
  trackRequestPromise(handle, promise) {
    this.startRequest(handle);
    promise.then(() => this.endRequest(handle)).catch(() => this.endRequest(handle));
  }

  // PRIVATE

  // debounce request updates, to prevent duplicate updates in the same tick
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
        request.resolve(true);
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
        delete this.requestMap[request.handle.id];
        i--;
      }
    }

    // Sort the remaining requests based on priority
    requestQueue.sort((a, b) => a.priority - b.priority);
  }

  // Update a single request by calling the callback
  _updateRequest(request) {
    request.priority = request.callback(request.handle); // eslint-disable-line callback-return

    // by returning a negative priority, the callback cancels the request
    if (request.priority < 0) {
      request.resolve(false);
      return false;
    }
    return true;
  }
}
