# Working with Tables

---
title: Working with tables
description: Move between row-oriented and columnar table representations while keeping a stable application contract.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Table data"
  title="Choose the table shape for the next operation."
  description="loaders.gl tables can be convenient object rows or typed Arrow columns. The right representation depends on whether the next step is application logic, scanning, geometry processing, worker transfer, or writing."
  tone="cyan"
  meta={['Object rows', 'Arrow columns', 'Batch-compatible']}
  links={[
    {label: 'Table category', to: '/docs/specifications/category-table'},
    {label: 'Apache Arrow', to: '/docs/developer-guide/apache-arrow'},
    {label: 'Loader categories', to: '/docs/developer-guide/loader-categories'}
  ]}
/>

<DocOrientation
  eyebrow="A small decision"
  title="Keep data structured as it travels."
  description="The table category gives related loaders a common result shape. Applications can start with readable rows, switch to Arrow for scale, and preserve the same pipeline boundaries as data moves between formats."
  tone="cyan"
  items={[
    {label: 'Object-row table', value: 'Easy to inspect and convenient for ordinary application code.'},
    {label: 'Arrow table', value: 'Typed columns suited to scans, transforms, workers, and analytics.'},
    {label: 'Table batch', value: 'A bounded unit for streaming and incremental processing.'},
    {label: 'Geometry table', value: 'Arrow-compatible columns for GeoArrow and spatial workflows.'}
  ]}
/>

<ReferenceBoundary
  title="Table category reference"
  description="The detailed material below explains the supported table interfaces, conversions, metadata, and the relationship between rows, batches, and Arrow columns."
  tone="cyan"
/>

The loaders.gl table category provides support for working interchangeably with row-oriented and columnar tables.
