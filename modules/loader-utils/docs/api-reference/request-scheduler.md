# RequestScheduler

The request scheduler provides control when working with large numbers of requests, allowing applications to make the most efficient use of the browser's limited request queue, and also retry requests in a simple way.

The `RequestScheduler` class
- Enables an application to queue a large number of requests without flooding the browser's request queue.
- Provided a mechanism for applications to cancel or reprioritize queued requests before they are actually "issued", through a `getPriority()` callback.
- Enables applications to reschedule requests (e.g. if a 429 HTTP error is received).


- Some information on browser [request throttling](https://docs.pushtechnology.com/cloud/latest/manual/html/designguide/solution/support/connection_limitations.html)

## Usage

For the simplest usage, use `RequestScheduler.scheduledFetch()`. This will both wait for a slot, and retry the fetch if 429s are returned.

```js
const url = '...';
const response = await requestScheduler.scheduledFetch(url);
switch (response.status) {
  case 408: // Request was cancelled by getPriority (or server did time out...)
  case 429: // Too many retries
  ...
}
```

To just schedule a request, wait for a token to be returned from `RequestScheduler.scheduleRequest()`. Once the token resolves, the request can issued without be immediately processed.

```js
const url = '...';
const requestToken = await requestScheduler.scheduleRequest(url);
if (requestToken) {
  await fetch(url);
  requestToken.done(); // NOTE: **must** be called for the next request in queue to resolve
}
```

To schedule a request, rescheduling it repeatedly when 429 errors happen:

```js
const url = '...';
let requestToken = await requestScheduler.scheduleRequest(url);
try {
  let done = false;
  while (!done) {
    const response = await fetch(url);
    if (response.status === 429) {
      requestToken = await requestToken.reschedule();
      continue;
    } 
    
    if (response.ok) {
      // process response
      done = true;
    } else {
      // handle error
      done = true;
    }
  }
} finally {
  requestToken.done(); // NOTE: **must** be called for the next request in queue to resolve
}
```

## Methods

### constructor(options?: object)

- `id`?: string - An identifier. Mainly intended for debugging.
- `throttleRequests`?: boolean;
- `maxRequests`?: number; - Max parallel requests
- `maxRetries`?: number - Maximum number of retries for a request

### scheduledFetch(url: string, fetchOptions?: object, schedulerOptions?: object)

- `fetchOptions` are passed to `fetch` (Note: they are not used if `fetch` is overridden in `schedulerOptions`)

- `schedulerOptions.getPriority` - 
- `schedulerOptions.fetch` - Override the `fetch` function
- `schedulerOptions.scheduleFailureStatus` - `408` - by default, cancellation is reported as a [`408 Request Timeout`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/408).
- `schedulerOptions.retryFailureStatus` - `429 Too Many Requests` - by default, retry failure is reported as a [`429`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429).


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

- resolves to an object (with a `done` field) when the request can be issued without queueing. The application should issue the request and call `done()` when completed.
- resolves to `null` if the request has been cancelled (by the callback return < 0).
  In this case the application should not issue the request.

## About Request Priorities

The `getPriority` callback controls priority of requests and also cancellation of outstanding requests.
