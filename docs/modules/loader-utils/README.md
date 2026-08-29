---
title: Loader utilities
description: Build loaders around shared files, requests, caches, and source helpers.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Loader utilities"
  title="Give format implementations the same transport primitives."
  description="`@loaders.gl/loader-utils` contains the lower-level contracts used by loaders and sources: random-access files, HTTP ranges, request scheduling, caches, URI resolution, and context-aware parsing."
  tone="cyan"
  meta={['Random access', 'Range requests', 'Scheduling and caches']}
  links={[
    {label: 'Readable files', to: '/docs/modules/loader-utils/api-reference/readable-file'},
    {label: 'HTTP files', to: '/docs/modules/loader-utils/api-reference/http-file'},
    {label: 'Range scheduling', to: '/docs/modules/loader-utils/api-reference/range-request-scheduler'}
  ]}
/>

<DocOrientation
  eyebrow="The loader utility boundary"
  title="Normalize transport once. Let each loader focus on its format."
  description="These utilities make remote and local data look alike to a loader, then add the controls needed for large datasets: bounded concurrency, byte-range coalescing, caching, stable references, and parser context."
  tone="cyan"
  items={[
    {label: 'Files', value: 'ReadableFile, ArrayBufferFile, and HttpFile'},
    {label: 'Requests', value: 'Schedulers for concurrency and byte ranges'},
    {label: 'Caches', value: 'Request and exact-range result reuse'},
    {label: 'Context', value: 'URI resolution and nested parser coordination'}
  ]}
/>

<ReferenceBoundary
  title="Transport and loader-building details"
  description="The reference below lists the shared file, request, cache, URI, and context APIs used by format implementations and cloud-native sources."
  tone="cyan"
/>

The `@loaders.gl/loader-utils` contains utilities for creating loaders.

## API

- [`ReadableFile`](/docs/modules/loader-utils/api-reference/readable-file) provides the common random-access file contract.
- [`ArrayBufferFile`](/docs/modules/loader-utils/api-reference/readable-file#adapting-an-arraybuffer) provides direct random access to in-memory data.
- [`HttpFile`](/docs/modules/loader-utils/api-reference/http-file) validates random-access HTTP reads and remote object identity.
- [`RequestScheduler`](/docs/modules/loader-utils/api-reference/request-scheduler) limits asynchronous request concurrency.
- [`RangeRequestScheduler`](/docs/modules/loader-utils/api-reference/range-request-scheduler) coalesces compatible byte ranges.
- [`RequestCache`](/docs/modules/loader-utils/api-reference/request-cache) deduplicates and bounds ordinary asynchronous request results.
- [`RangeRequestCache`](/docs/modules/loader-utils/api-reference/range-request-cache) caches exact and contained byte ranges.
- [`CachedUriResolver`](/docs/modules/loader-utils/api-reference/cached-uri-resolver) resolves resource references against one stable base and memoizes repeated derivations for a caller-controlled lifetime.
