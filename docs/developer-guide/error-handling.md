---
title: Handling errors
description: Distinguish request failures, service responses, and parser failures with one async error model.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Failure is part of the data path"
  title="Tell the user what failed, not just that it failed."
  description="A load can fail while fetching bytes, while a service rejects a request, or while a parser rejects the returned data. loaders.gl keeps those failures observable through promises and exceptions."
  tone="orange"
  meta={['Network errors', 'Service responses', 'Parser errors']}
  links={[
    {label: 'Authentication', to: '/docs/developer-guide/authentication'},
    {label: 'Core load API', to: '/docs/modules/core/api-reference/load'}
  ]}
/>

<DocOrientation
  eyebrow="Three failure boundaries"
  title="Access, response, or content."
  description="Handle the failure at the boundary that owns it. Preserve the original error and add request or format context when presenting a useful message to an application user."
  tone="orange"
  items={[
    {label: 'Access', value: 'DNS, network, timeout, or missing resource'},
    {label: 'Response', value: 'HTTP status, auth, or service parameters'},
    {label: 'Content', value: 'Malformed or unsupported format data'},
    {label: 'Async API', value: 'Catch exceptions or rejected promises'}
  ]}
/>

Loading can fail at three boundaries:

- **Transport:** the request fails, is cancelled, or cannot access a local file.
- **HTTP response:** the server returns an unsuccessful status.
- **Parsing:** the bytes are malformed or use an unsupported format feature.

## Parsing and loading errors

`load` and `parse` return promises. Use `await` inside `try`/`catch`, or attach a
rejection handler. When given a `Response`, core checks its status before parsing.
A parser can also reject a successful HTTP response whose contents are invalid.

```typescript
import {load} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';

try {
  const table = await load(url, CSVLoader);
  displayTable(table);
} catch (error) {
  showError(error instanceof Error ? error.message : String(error));
}
```

Synchronous APIs such as `parseSync` throw directly and use the same `try`/`catch`
pattern. `core.nothrow` only suppresses loader-selection failure; it is not a
blanket parser-error handler.

## Checking fetch responses

The runtime's `fetch` rejects on transport failure, but an HTTP error status still
resolves to a `Response`. Check `response.ok` before reading or parsing data:

```typescript
const response = await fetch(url);
if (!response.ok) {
  throw new Error(`Request failed: ${response.status} ${response.statusText}`);
}
const data = await response.arrayBuffer();
```

If a service returns a JSON or XML error envelope with a successful status, use
its source/loader's documented error handling or validate the envelope yourself.
Error bodies have no universal format; avoid presenting arbitrary server HTML as
application UI. See [authentication](/docs/developer-guide/authentication) for
provider response handling and refresh behavior.
