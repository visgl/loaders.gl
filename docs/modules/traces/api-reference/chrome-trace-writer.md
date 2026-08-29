---
title: ChromeTraceWriter
description: Serialize Arrow trace events as Chrome Trace Event JSON.
hide_title: true
page_style: designed
---

import {TracesDocsTabs} from '@site/src/components/docs/traces-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Traces module · writer API"
  title="ChromeTraceWriter"
  description="Serialize a typed Chrome trace Arrow table or record batch back into a Chrome Trace Event JSON container."
  tone="violet"
  meta={['Chrome Trace Event', 'Arrow input', 'JSON output']}
  links={[
    {label: 'Chrome trace format', to: '/docs/modules/traces/formats/chrome-trace'},
    {label: 'ChromeTraceLoader', to: '/docs/modules/traces/api-reference/chrome-trace-loader'},
    {label: 'Traces module', to: '/docs/modules/traces'}
  ]}
/>

<TracesDocsTabs active="chrometracewriter" />

<DocOrientation
  eyebrow="What it writes"
  title="Turn columnar trace events back into tooling data."
  description="ChromeTraceWriter restores logical identifiers, event arguments, unknown fields, and phase-specific values so transformed trace tables can return to Chrome-compatible JSON."
  tone="violet"
  items={[
    {label: 'Input', value: 'Chrome trace Arrow table or batch'},
    {label: 'Output', value: 'Chrome Trace Event JSON'},
    {label: 'Restores', value: 'Args, IDs, scopes, and passthrough fields'},
    {label: 'Options', value: 'Display units and top-level metadata'}
  ]}
/>

<ReferenceBoundary
  title="ChromeTraceWriter reference"
  description="The sections below document usage, restored fields, options, and schema metadata precedence."
  tone="violet"
/>

`ChromeTraceWriter` serializes a `ChromeTraceEventArrowTable` or compatible Arrow record batch as a
Chrome Trace Event JSON container.

## Usage

```typescript
import {load, encode, encodeText} from '@loaders.gl/core';
import {ChromeTraceLoader, ChromeTraceWriter} from '@loaders.gl/traces';

const table = await load('input.json', ChromeTraceLoader, {
  chromeTrace: {shape: 'arrow-table'}
});

const jsonBytes = await encode(table, ChromeTraceWriter);
const jsonText = await encodeText(table, ChromeTraceWriter);
```

The writer decodes `args` and `extraJson`, restores unknown event fields, converts normalized
identifier columns back to their logical values, and restores phase-specific scope fields.

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `chromeTrace.displayTimeUnit` | `string` | Arrow schema metadata | Overrides the top-level `displayTimeUnit`. |
| `chromeTrace.metadata` | `Record<string, unknown>` | Arrow schema metadata | Overrides the top-level `metadata` object. |

Explicit options take precedence over Arrow schema metadata.

```typescript
const json = await encodeText(table, ChromeTraceWriter, {
  chromeTrace: {
    displayTimeUnit: 'us',
    metadata: {source: 'post-processed'}
  }
});
```

## Input Contract

The writer accepts the whole-file Arrow schema documented on the
[Chrome Trace format page](../formats/chrome-trace), including schema metadata produced by
`ChromeTraceLoader`. It also accepts streamed Chrome Arrow record batches through the shared Arrow
adapter.

The writer produces compact JSON. Source whitespace, object key order, and original numeric text
formatting are not retained.
