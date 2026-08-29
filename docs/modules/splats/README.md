---
title: Gaussian splat module
description: Load binary Gaussian splat formats for rendering, processing, and paged level-of-detail streaming.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Point-based scene data"
  title="Load splats in the format the scene already uses."
  description="The splats module handles several binary Gaussian splat layouts and exposes full-buffer or source-based entry points for rendering, processing, and level-of-detail streaming."
  tone="pink"
  meta={['SPLAT', 'KSPLAT', 'SPZ and RAD']}
  links={[
    {label: 'Splats formats', to: '/docs/modules/splats/formats/splats'},
    {label: '3D data formats', to: '/docs/developer-guide/3d-data-formats'}
  ]}
/>

<DocOrientation
  eyebrow="One visual primitive, several files"
  title="Keep the splat data compact until the renderer needs it."
  description="SPLAT, KSPLAT, SPZ, and RAD use different storage and paging conventions. The module keeps those differences at the loader boundary while making the scene data available to applications."
  tone="pink"
  items={[
    {label: 'Full buffers', value: 'Load complete SPLAT, KSPLAT, or SPZ files'},
    {label: 'Paged data', value: 'Use RAD source metadata and chunks'},
    {label: 'Output', value: 'Gaussian splat attributes for rendering'},
    {label: 'Status', value: 'Experimental v5.0 module'}
  ]}
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

The `@loaders.gl/splats` module loads binary Gaussian splat files for rendering,
processing, or paged level-of-detail streaming.

<ReferenceBoundary
  title="Splat loaders and formats"
  description="The sections below list installation, loader entry points, format families, and the available full-buffer and source paths."
  tone="pink"
/>

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/splats
```

## Loaders

| Loader                                                        | Description                                                |
| ------------------------------------------------------------- | ---------------------------------------------------------- |
| [`SPLATLoader`](/docs/modules/splats/api-reference/splat-loader)   | Loads raw `.splat` Gaussian splat files.                   |
| [`KSPLATLoader`](/docs/modules/splats/api-reference/ksplat-loader) | Loads GaussianSplats3D `.ksplat` files from full buffers. |
| [`SPZLoader`](/docs/modules/splats/api-reference/spz-loader)       | Loads Niantic Spatial `.spz` files from full buffers.     |
| [`RADLoader`](/docs/modules/splats/api-reference/rad-source-loader) | Loads Spark `.rad` metadata from full buffers.            |
| [`RADSourceLoader`](/docs/modules/splats/api-reference/rad-source-loader) | Creates a source for Spark `.rad` metadata and chunks. |

## Formats

| Format                                      | Description                                          |
| ------------------------------------------- | ---------------------------------------------------- |
| [SPLAT / KSPLAT / SPZ / RAD](/docs/modules/splats/formats/splats) | Binary Gaussian splat formats for real-time scenes. |
