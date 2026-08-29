---
title: Graphs
description: A home for graph-format parsers as graph support develops.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Graphs module"
  title="Keep graph data on the format roadmap."
  description="`@loaders.gl/graphs` is reserved for parsers that bring graph serializations into loaders.gl. The module currently documents its intended scope while DOT, GraphML, and additional formats are being developed."
  tone="violet"
  meta={['Planned module', 'DOT', 'GraphML']}
  links={[
    {label: 'Loader categories', to: '/docs/developer-guide/loader-categories'},
    {label: 'GitHub repository', to: 'https://github.com/visgl/loaders.gl'}
  ]}
/>

<DocOrientation
  eyebrow="The graph data boundary"
  title="Parse a graph file into a reusable application model."
  description="When graph parsers land, the module will keep serialization details at the edge so applications can work with nodes, edges, and graph metadata consistently."
  tone="violet"
  items={[
    {label: 'Initial formats', value: 'DOT and GraphML'},
    {label: 'Application data', value: 'Nodes, edges, and graph metadata'},
    {label: 'Integration', value: 'Standard loaders.gl loader contracts'},
    {label: 'Current status', value: 'Scope documented; implementation developing'}
  ]}
/>

<ReferenceBoundary
  title="Current scope"
  description="This page records the supported roadmap rather than promising parser APIs that are not yet available."
  tone="violet"
/>

The `@loaders.gl/graphs` module will provide parsers for graph formats such as DOT and GraphML.

## Scope

- DOT
- GraphML
- Additional graph serialization formats as they are added
