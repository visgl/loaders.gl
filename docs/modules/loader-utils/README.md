# Overview

The `@loaders.gl/loader-utils` contains utilities for creating loaders.

## API

- [`ReadableFile`](/docs/modules/loader-utils/api-reference/readable-file) provides the common random-access file contract.
- [`ArrayBufferFile`](/docs/modules/loader-utils/api-reference/readable-file#adapting-an-arraybuffer) provides direct random access to in-memory data.
- [`HttpFile`](/docs/modules/loader-utils/api-reference/http-file) validates random-access HTTP reads and remote object identity.
- [`RequestScheduler`](/docs/modules/loader-utils/api-reference/request-scheduler) limits asynchronous request concurrency.
- [`RangeRequestScheduler`](/docs/modules/loader-utils/api-reference/range-request-scheduler) coalesces compatible byte ranges.
- [`CachedUriResolver`](/docs/modules/loader-utils/api-reference/cached-uri-resolver) resolves resource references against one stable base and memoizes repeated derivations for a caller-controlled lifetime.
