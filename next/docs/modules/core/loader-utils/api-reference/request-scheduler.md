Loader utilities / request scheduling

# Control when outstanding work gets a network slot.

RequestScheduler does not fetch resources itself. It coordinates the moment an application is allowed to issue a request, and it can reevaluate priority as the camera, viewport, or application state changes.

[Loader utilities](https://loaders.gl/next/docs/modules/core/loader-utils.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/loader-utils.md)[3D Tiles priorities](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/request-scheduling-and-priorities.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/request-scheduling-and-priorities.md)[Request cache](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/request-cache.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/request-cache.md)

Request coordination

## Issue many requests without issuing them all at once.

Applications can describe work immediately, then let the scheduler decide which request starts when capacity is available. Priority callbacks are reevaluated as pending work and application state change.

01

Queue

Register work that is ready to be issued.

02

Limit

Keep active requests within a configured concurrency.

03

Prioritize

Reevaluate outstanding work when a slot opens.

04

Complete

Release the token so the next queued request can proceed.

Detailed guide

## RequestScheduler reference

The detailed reference covers construction, scheduling tokens, priority callbacks, throttling, cancellation, and completion lifecycle.

![From-v2.2](https://img.shields.io/badge/From-v2.2-blue.svg?style=flat-square)

The request scheduler enables an application to "issue" a large number of requests without flooding the browser's limited request queue.

A getPriority callback is called on all outstanding requests whenever a slot frees up, allowing the application to reprioritize or even cancel "issued" requests if the application state has changed.

Note: The request scheduler does not actually issue requests, it just lets apps know when the request can be issued without overwhelming the connection and the server.

A primary use case is to let the app reprioritize or cancel requests if circumstances change before the request can be scheduled.

* Some information on browser [request throttling](https://docs.pushtechnology.com/cloud/latest/manual/html/designguide/solution/support/connection_limitations.html)

## Usage[​](#usage "Direct link to Usage")

To schedule a request so that it can be issued at a time when it can be immediately processed.

```
const URL = '...';

const requestToken = await requestScheduler.scheduleRequest(URL);

if (requestToken) {

  await fetch(URL);

  requestToken.done(); // NOTE: **must** be called for the next request in queue to resolve

}
```

## Methods[​](#methods "Direct link to Methods")

### constructor(options?: object)[​](#constructoroptions-object "Direct link to constructor(options?: object)")

* `id`?: string;
* `throttleRequests`?: boolean; — Whether to throttle requests.
* `maxRequests`?: number; — Maximum concurrent requests to be opened by this scheduler. Additional requests are queued until an open request has completed.
* `debounceTime`?: number; — Queue requests until no new requests have been added for at least `debounceTime` milliseconds.

Each new queued request restarts the debounce window. Completing a request does not restart or bypass a pending window. Once the window has expired, freed slots are refilled on the next event-loop tick without another debounce delay.

This differs from [RangeRequestScheduler](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/range-request-scheduler.md), whose `batchDelayMs` starts a fixed batching window with the first queued range and is not extended by later arrivals.

When `throttleRequests` is disabled, `maxRequests` and `debounceTime` options have no effect.

### `scheduleRequest(handle: any, getPriority?: () => number): Promise<{done: () => any)}>`[​](#schedulerequesthandle-any-getpriority---number-promisedone---any "Direct link to schedulerequesthandle-any-getpriority---number-promisedone---any")

Called by an application that wants to issue a request, without having it deeply queued by the browser

When the returned promise resolved, it is OK for the application to issue a request. The promise resolves to an object that contains a `done` method. When the application's request has completed (or failed), the application must call the `done` function

Parameters

* `handle` an arbitrary handle to identify the request, e.g. a URL string
* `getPriority` will be called when request "slots" open up, allowing the caller to update priority or cancel the request Highest priority executes first, priority < 0 cancels the request

Returns a promise that

* resolves to an object (with a `done` field) when the request can be issued without queueing. The application should issue the request and call `done()` when completed.
* resolves to `null` if the request has been cancelled (by the callback return < 0). In this case the application should not issue the request.

### `setProps(props: object): void`[​](#setpropsprops-object-void "Direct link to setpropsprops-object-void")

Updates scheduler properties without recreating the instance. This preserves active and queued requests.

Parameters:

* `throttleRequests`?: boolean — Whether to throttle requests
* `maxRequests`?: number — Maximum concurrent requests
* `debounceTime`?: number — Debounce time in milliseconds

Note: The `id` property cannot be updated after construction as it's tied to the stats tracker.

This is useful when you need to dynamically adjust throttling behavior, for example during a transition when otherwise many tile requests would be issued.

## About Request Priorities[​](#about-request-priorities "Direct link to About Request Priorities")

The `getPriority` callback controls priority of requests and also cancellation of outstanding requests.
