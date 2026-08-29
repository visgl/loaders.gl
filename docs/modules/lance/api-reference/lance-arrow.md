---
title: Lance Arrow readers
description: Read selected Lance columns and coordinates into Arrow tables using bounded local or remote reads.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Lance API / Arrow readers"
  title="Read the columns that answer the question."
  description="The Lance Arrow helpers perform focused reads from Lance data files. They keep the current supported boundary explicit: selected fixed-width primitive columns and two-dimensional float coordinates, decoded directly into Arrow."
  tone="cyan"
  meta={['Remote range reads', 'Selected columns', 'Arrow output']}
  links={[
    {label: 'Lance module', to: '/docs/modules/lance'},
    {label: 'Lance source', to: '/docs/modules/lance/api-reference/lance-source-loader'},
    {label: 'Apache Arrow', to: '/docs/developer-guide/apache-arrow'}
  ]}
/>

<DocOrientation
  eyebrow="Bounded column reads"
  title="Keep the read narrow and the result typed."
  description="These helpers are useful when a dataset is larger than the immediate operation. The caller selects physical columns and names, the reader issues only the required range requests, and the result remains an Arrow table."
  tone="cyan"
  items={[
    {label: 'Select', value: 'Provide physical column indexes and explicit names.'},
    {label: 'Transport', value: 'Read local files or remote byte ranges.'},
    {label: 'Decode', value: 'Handle supported fixed-width primitive Lance encodings.'},
    {label: 'Return', value: 'Produce Arrow columns, including 2D coordinate columns.'}
  ]}
/>

<ReferenceBoundary
  title="Lance Arrow reader reference"
  description="The detailed reference covers helper signatures, supported physical types, coordinate reads, remote ranges, and current limitations."
  tone="cyan"
/>

<p class="badges">
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

The Lance Arrow helpers perform bounded reads from a local or remote Lance data
file. `readLanceRemoteFileToArrow()` supports selected fixed-width primitive
columns. `readLanceRemoteCoordinatesToArrow()` supports two-dimensional
fixed-size float columns such as PushT's `observation_state`.

Both APIs are Work In Progress and currently require physical column indexes,
explicit names, and known Lance encodings.
