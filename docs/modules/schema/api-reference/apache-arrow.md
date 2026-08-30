# Apache Arrow

---
title: Apache Arrow interoperability
description: The typed, columnar interchange layer behind loaders.gl tables.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Schema module · interoperability"
  title="Apache Arrow"
  description="loaders.gl uses Apache Arrow as a practical common language for typed, columnar data. Arrow-backed tables let loaders, scanners, workers, and applications share buffers without agreeing on the original file format."
  tone="cyan"
  meta={['Typed columns', 'Zero-copy capable', 'Arrow-aligned']}
  links={[
    {label: 'Arrow guide', to: '/docs/developer-guide/apache-arrow'},
    {label: 'Schema module', to: '/docs/modules/schema'},
    {label: 'ArrowLoader', to: '/docs/modules/arrow/api-reference/arrow-loader'}
  ]}
/>

<DocOrientation
  eyebrow="The common table layer"
  title="Keep data columnar as it crosses boundaries."
  description="Arrow supplies the physical model; loaders.gl adds table contracts and format-specific adapters around it. The result is a stable handoff between decoding, scanning, workers, and visualization."
  tone="cyan"
  items={[
    {label: 'Types', value: 'Explicit primitive, nested, and binary types'},
    {label: 'Buffers', value: 'Typed memory with offsets and validity'},
    {label: 'Batches', value: 'Bounded record groups for streaming'},
    {label: 'Interop', value: 'Shared data across formats and runtimes'}
  ]}
/>

<ReferenceBoundary
  title="Arrow interoperability"
  description="This page is an entry point for the Arrow relationship; detailed APIs live in the schema and Arrow module references."
  tone="cyan"
/>

loaders.gl aims to provide strong support for and interoperability with Apache Arrow.
