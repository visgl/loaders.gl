---
title: LAS and LAZ format
description: Work with point-cloud records, lossless LAZ compression, and cloud-optimized COPC data through shared mesh and table shapes.
hide_title: true
page_style: designed
---

import {LasDocsTabs} from '@site/src/components/docs/las-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Point-cloud format"
  title="Point records that scale from files to the cloud."
  description="LAS defines a widely used binary point-cloud record layout. loaders.gl reads LAS and LAZ into application-friendly point or Arrow data, and provides the same category boundary for writers and cloud-oriented COPC workflows."
  tone="orange"
  meta={['LAS and LAZ', 'PointCloud and Mesh Arrow', 'COPC relationship']}
  links={[
    {label: 'LAS module', to: '/docs/modules/las'},
    {label: 'LASLoader', to: '/docs/modules/las/api-reference/las-loader'},
    {label: 'COPC', to: '/docs/modules/copc'}
  ]}
/>

<LasDocsTabs active="format" />

<DocOrientation
  eyebrow="Point-cloud data path"
  title="Choose a convenient view of the same records."
  description="The format preserves point attributes and coordinate metadata while the loader can expose them as a render-ready point cloud or as typed columns for scans, transforms, workers, and writers."
  tone="orange"
  items={[
    {label: 'LAS', value: 'Uncompressed binary records with a defined public header.'},
    {label: 'LAZ', value: 'Lossless compressed LAS records for smaller transfers.'},
    {label: 'Category data', value: 'PointCloud objects or Mesh Arrow tables.'},
    {label: 'Cloud access', value: 'Use COPC when hierarchy and range reads matter.'}
  ]}
/>

<ReferenceBoundary
  title="LAS format and API details"
  description="The reference below covers the record layout, versions, compression, coordinate metadata, loader behavior, and writer compatibility."
  tone="orange"
/>

| Characteristic       | Value                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------ |
| File Format          | [LAS / LAZ](/docs/modules/las/formats/las)                                                  |
| Data Format          | [PointCloud](/docs/specifications/category-mesh), [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables) |
| File Extensions      | `.las`, `.laz`                                                                             |
| MIME Type            | Not standardized                                                                           |
| File Type            | Binary                                                                                     |
| Loader APIs          | `load`, `parse`, `parseSync`, `parseInBatches`                                             |
| Loader Worker Thread | Yes                                                                                        |
| Loader Streaming     | Yes                                                                                        |
| Writer APIs          | `encode`, `encodeSync`                                                                     |

## Loaders and Writers

<div className="docs-api-card-grid">
  <a className="docs-api-card" href="/docs/modules/las/api-reference/las-loader">
    <span className="docs-api-card__kind">Loader</span>
    <strong>LASLoader</strong>
    <span>Loads LAS and LAZ point clouds as PointCloud objects or Mesh Arrow tables.</span>
    <span className="docs-api-card__meta">Output: PointCloud, Mesh Arrow table</span>
    <span className="docs-api-card__meta">APIs: load, parse, parseSync</span>
  </a>
  <a className="docs-api-card" href="/docs/modules/las/api-reference/las-writer">
    <span className="docs-api-card__kind">Writer</span>
    <strong>LASWriter</strong>
    <span>Writes Mesh or Mesh Arrow table point clouds as uncompressed LAS data.</span>
    <span className="docs-api-card__meta">Input: Mesh, Mesh Arrow table</span>
    <span className="docs-api-card__meta">APIs: encode, encodeSync</span>
  </a>
</div>

## LAS, LAZ, and COPC

LAS stores uncompressed point cloud data. LAZ is the lossless compressed variant.

## Support

See the [LAS/LAZ implementation limits](/docs/modules/las/formats/las#current-implementation-limits) for supported versions, point formats, codec combinations, and streaming behavior.
