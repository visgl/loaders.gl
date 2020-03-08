type RequestSchedulerProps = {
  id?: string;
  throttleRequests?: boolean;
  maxRequests?: number;
};

type DoneFunction = () => any;

export default class RequestScheduler {
  constructor(props?: RequestSchedulerProps);

  /**
   * Called by an application that wants to issue a request, without having it deeply queued by the browser
   * 
   * When the returned promise resolved, it is OK for the application to issue a request.
   * The promise resolves to an object that contains a `done` method.
   * When the application's request has completed (or failed), the application must call the 
   * 
   * @param handle 
   * @param getPriority will be called when request "slots" open up,
   *    allowing the caller to update priority or cancel the request
   *    Highest priority executes first, priority < 0 cancels the request
   * @returns a promise
   *   - resolves when the request can be issued without queueing,
   *   - rejects if the request has been cancelled (by the callback return < 0)
   */
  scheduleRequest(handle: any, getPriority?: () => number): Promise<{done: DoneFunction}>;
}
