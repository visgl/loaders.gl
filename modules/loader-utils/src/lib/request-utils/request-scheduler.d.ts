type RequestSchedulerProps = {
  id?: string;
  throttleRequests?: boolean;
  maxRequests?: number;
};

type SchedulerOptions = {
  getPriority?: () => number ;//  - 
  fetch?: (url: string, options: object) => Response; //  - Override the `fetch` function
  scheduleFailureStatus?: number; //  - `408` - by default, cancellation is reported as a [`408 Request Timeout`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/408).
  retryFailureStatus?: number;//  - `429 Too Many Requests` - by default, retry failure is reported 
};

type RequestToken = {
  done: () => any;
  reschedule: () => any;
  handle?: any;
};

export default class RequestScheduler {

  readonly activeRequestCount: number;

  constructor(props?: RequestSchedulerProps);

  /**
   * 
   * @param url - URL to load from
   * @param fetchOptions - Options passed to `fetch`
   * @param schedulerOptions - Scheduler options, including `getPriority`
   */
  scheduledFetch(url: string, fetchOptions?: object, schedulerOptions?: SchedulerOptions)

  /**
   * Called by an application that wants to issue a request, without having it deeply queued by the browser
   * 
   * When the returned promise resolved, it is OK for the application to issue a request.
   * The promise resolves to an object that contains `done` and `reschedule` methods.
   * When the application's request has completed (or failed), the application must call the `done` function.
   * It may be advisable to do this in a `try/finally` statement.
   * 
   * @param handle 
   * @param getPriority will be called when request "slots" open up,
   *    allowing the caller to update priority or cancel the request
   *    Highest priority executes first, priority < 0 cancels the request
   * @returns a promise
   *   - resolves to a token when the request can be issued without queueing,
   *   - resolves to `null` if the request has been cancelled (by the callback return < 0).
   *     In this case the application should not issue the request
   */
  scheduleRequest(handle: any, getPriority?: () => number): Promise<RequestToken | null>;
}
