type RequestSchedulerProps = {
  id?: string;
  throttleRequests?: boolean;
  maxRequests?: number;
};

export default class RequestScheduler {
  constructor(props?: RequestSchedulerProps);

  /**
   * Called by an application that wants to issue a request, without having it deeply queued by the browser
   * 
   * @param handle 
   * @param callback will be called when request "slots" open up,
   *    allowing the caller to update priority or cancel the request
   *    Highest priority executes first, priority < 0 cancels the request
   * @return a promise that resolves when the request can be issued without queueing,
   *    or rejects if the request has been cancelled (by the callback)
   */
  scheduleRequest(handle: any, callback?: () => number): Promise<boolean>;
  
  /**
   * Called by an application to mark that it is actively making a request
   * @param handle 
   */
  startRequest(handle: any);

  /**
   * Called by an application to mark that it is finished making a request
   * @param handle 
   */
  endRequest(handle: any);

  /**
   * Tracks a request promise, starting and then ending the request (triggering new slots).
   * @param handle 
   * @param promise 
   */
  trackRequestPromise(handle: any, promise: any);
}
