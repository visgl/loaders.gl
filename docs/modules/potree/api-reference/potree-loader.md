---
title: PotreeLoader
description: Load Potree point-cloud metadata and hierarchy information for tiled visualization.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import {PotreeDocsTabs} from '@site/src/components/docs/potree-docs-tabs';

<DocPageHeader
  eyebrow="Potree loader"
  title="Connect a Potree hierarchy to a point-cloud pipeline."
  description="`PotreeLoader` is the entry point for Potree point-cloud assets. The format is still evolving in loaders.gl, so this page makes the current support boundary explicit before the detailed reference."
  tone="violet"
  meta={['Potree', 'Point clouds', 'Work in progress']}
  links={[
    {label: 'Potree module', to: '/docs/modules/potree'},
    {label: '3D data formats', to: '/docs/developer-guide/3d-data-formats'},
    {label: 'Using sources', to: '/docs/developer-guide/using-sources'}
  ]}
/>

<DocOrientation
  eyebrow="The Potree path"
  title="Discover the hierarchy first. Stream point data as support grows."
  description="Potree assets separate metadata and hierarchy from point payloads. Keep traversal and rendering concerns in the source or layer while the loader owns format decoding."
  tone="violet"
  items={[
    {label: 'Input', value: 'Potree metadata and point-cloud resources'},
    {label: 'Discover', value: 'Hierarchy, bounds, spacing, and attributes'},
    {label: 'Decode', value: 'Point records as support is implemented'},
    {label: 'Status', value: 'Work in progress; verify current coverage'}
  ]}
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square" alt="From-v1.0" />
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

<PotreeDocsTabs active="loader" />

<ReferenceBoundary
  title="Current Potree support"
  description="The reference below records the current implementation boundary and will expand as hierarchy traversal and point decoding mature."
  tone="violet"
/>

Work in progress
