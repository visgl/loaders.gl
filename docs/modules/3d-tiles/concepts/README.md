---
title: 3D Tiles runtime concepts
description: Understand the runtime stages that turn a 3D Tiles hierarchy into visible, cacheable content.
hide_title: true
page_style: designed
---

import {Tiles3DDocsTabs} from '@site/src/components/docs/tiles-3d-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="3D Tiles runtime"
  title="From tileset metadata to visible content."
  description="These guides explain the decisions made between a tileset response and the content an application can render: resource detection, hierarchy traversal, level of detail, request priority, and memory."
  tone="violet"
  meta={['Traversal and LOD', 'Request scheduling', 'Cache diagnostics']}
  links={[
    {label: '3D Tiles module', to: '/docs/modules/3d-tiles'},
    {label: 'Tiles3DSource', to: '/docs/modules/tiles/api-reference/tiles-3d-source'},
    {label: '3D formats', to: '/docs/developer-guide/3d-data-formats'}
  ]}
/>

<Tiles3DDocsTabs active="runtime" />

<DocOrientation
  eyebrow="A view-dependent pipeline"
  title="Each stage answers a different question."
  description="A runtime first resolves and classifies resources, then traverses the hierarchy, chooses an acceptable level of detail, schedules missing content, and keeps useful results available for the next frame."
  tone="violet"
  items={[
    {label: 'Resolve', value: 'Turn references, templates, and archives into fetchable resources.'},
    {label: 'Select', value: 'Use visibility, geometric error, and refinement to choose coverage.'},
    {label: 'Schedule', value: 'Rank required requests within network and decode limits.'},
    {label: 'Retain', value: 'Reuse current content while managing byte-native cache budgets.'}
  ]}
/>

<ReferenceBoundary
  title="The runtime guides"
  description="The sections below document each stage independently, with links back to the APIs and the measurements needed to diagnose a real tileset."
  tone="violet"
/>

Loading a large 3D Tiles tileset is a continuous pipeline: traverse the hierarchy, decide which level of detail is needed, rank missing content, load within concurrency limits, render safe coverage, and retain useful content in the cache. These pages document each stage and the options that connect them.

| Guide | Question it answers |
| --- | --- |
| [Resource resolution and content detection](/docs/modules/3d-tiles/concepts/resource-resolution-and-content-detection) | How are relative references, inherited queries, and extensionless content handled? |
| [Tile hierarchy and refinement](/docs/modules/3d-tiles/concepts/tile-hierarchy-and-refinement) | Which tiles can replace or augment their ancestors? |
| [Implicit tiling and lazy subtrees](/docs/modules/3d-tiles/concepts/implicit-tiling-and-subtrees) | When are implicit availability files requested and materialized? |
| [Screen-space error and LOD](/docs/modules/3d-tiles/concepts/screen-space-error-and-lod) | How much detail does the current view require? |
| [Request scheduling and priorities](/docs/modules/3d-tiles/concepts/request-scheduling-and-priorities) | Which required tile should use the next network slot? |
| [Caching and memory](/docs/modules/3d-tiles/concepts/caching-and-memory) | Which loaded tiles remain resident, and when may the budget be exceeded? |
| [Runtime tuning and diagnostics](/docs/modules/3d-tiles/concepts/runtime-tuning-and-diagnostics) | Which controls and measurements explain visible behavior? |

The stages are related but not interchangeable. In particular, screen-space error determines the desired final LOD. Progressive and foveated scheduling normally change only the order and timing of requests needed to reach that LOD.

Start with [resource resolution and content detection](/docs/modules/3d-tiles/concepts/resource-resolution-and-content-detection) to understand how a tileset enters the runtime, continue with [tile hierarchy and refinement](/docs/modules/3d-tiles/concepts/tile-hierarchy-and-refinement), follow [implicit tiling and lazy subtrees](/docs/modules/3d-tiles/concepts/implicit-tiling-and-subtrees) for availability-driven hierarchies, or go directly to the [request-scheduling guide](/docs/modules/3d-tiles/concepts/request-scheduling-and-priorities) for foveated requests.
