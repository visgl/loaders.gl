---
title: TableBatch
description: Bounded record batches for streaming table data.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Schema module · batch API"
  title="TableBatch"
  description="A table batch is a bounded unit of records emitted by streaming loaders and scans. It keeps progressive processing compatible with both row-oriented and Arrow-backed data."
  tone="cyan"
  meta={['Streaming unit', 'Arrow-aligned', 'Bounded records']}
  links={[
    {label: 'Schema module', to: '/docs/modules/schema'},
    {label: 'Parse in batches', to: '/docs/modules/core/api-reference/parse-in-batches'},
    {label: 'Apache Arrow', to: '/docs/developer-guide/apache-arrow'}
  ]}
/>

<DocOrientation
  eyebrow="The batch boundary"
  title="Process data while the rest is still arriving."
  description="Batches provide a stable unit for incremental parsing, worker transfer, filtering, and rendering. The batch shape tells consumers how to interpret its payload."
  tone="cyan"
  items={[
    {label: 'Rows', value: 'RowTableBatch for object or array records'},
    {label: 'Columns', value: 'ColumnarTableBatch for column data'},
    {label: 'Arrow', value: 'ArrowTableBatch for record batches'},
    {label: 'Progress', value: 'Optional byte and record progress metadata'}
  ]}
/>

<ReferenceBoundary
  title="TableBatch reference"
  description="The sections below list the supported batch families and their relationship to Arrow record batches."
  tone="cyan"
/>

- RowTableBatch
- ColumnarTableBatch
- ArrowTableBatch
