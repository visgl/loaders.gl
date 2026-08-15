# Overview

The `@loaders.gl/loader-utils` contains utilities for creating loaders.

## API reference

- [`ReadableFile`](/docs/modules/loader-utils/api-reference/readable-file) provides the common random-access file contract.
- [`HttpFile`](/docs/modules/loader-utils/api-reference/http-file) validates random-access HTTP reads and remote object identity.
- [`RequestScheduler`](/docs/modules/loader-utils/api-reference/request-scheduler) limits asynchronous request concurrency.
- [`RangeRequestScheduler`](/docs/modules/loader-utils/api-reference/range-request-scheduler) coalesces compatible byte ranges.
