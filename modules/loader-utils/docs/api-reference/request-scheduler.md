# Request Scheduler

The request scheduler enables an application to "issue" a large number of requests without flooding the browser's limited request queue.

A getPriority callback is called on all outstanding requests whenever a slot frees up, allowing the application to reprioritize or even cancel "issued" requests if the application state has changed.

## Usage

To issue
```js
const URL = '...';
const requestToken = await requestScheduler.scheduleRequest(URL);
if (requestToken) {
  await fetch(URL);
  requestToken.done();  // NOTE: **must** be called for the next request in queue to resolve
}
```

## Methods

### constructor(options?: object)

- `id`?: string;
- `throttleRequests`?: boolean;
- `maxRequests`?: number;

### scheduleRequest(handle: any, getPriority?: () => number): Promise<{done: () => any)}>;

Called by an application that wants to issue a request, without having it deeply queued by the browser

When the returned promise resolved, it is OK for the application to issue a request.
The promise resolves to an object that contains a `done` method.
When the application's request has completed (or failed), the application must call the `done` function

Parameters
- `handle` an arbitrary handle to identify the request, e.g. a URL string
- `getPriority` will be called when request "slots" open up,
   allowing the caller to update priority or cancel the request
   Highest priority executes first, priority < 0 cancels the request

Returns a promise that
- resolves when the request can be issued without queueing.
- rejects if the request has been cancelled (by the callback return < 0).

