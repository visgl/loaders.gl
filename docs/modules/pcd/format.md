---
title: PCD format
description: Read and write Point Cloud Data files as render-ready points or typed mesh columns.
hide_title: true
page_style: designed
---

import {PcdDocsTabs} from '@site/src/components/docs/pcd-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Point-cloud format"
  title="A simple point-cloud interchange."
  description="PCD describes point records with a compact header and ASCII or binary payload. loaders.gl maps those records to the shared point-cloud and Mesh Arrow shapes used by applications and writers."
  tone="blue"
  meta={['ASCII and binary', 'PointCloud output', 'Mesh Arrow output']}
  links={[
    {label: 'PCD module', to: '/docs/modules/pcd'},
    {label: 'PCDLoader', to: '/docs/modules/pcd/api-reference/pcd-loader'},
    {label: 'PCDWriter', to: '/docs/modules/pcd/api-reference/pcd-writer'}
  ]}
/>

<PcdDocsTabs active="format" />

<DocOrientation
  eyebrow="Point records"
  title="Keep the attributes, choose the representation."
  description="The PCD header declares the fields, sizes, types, and layout of each point. Once decoded, applications can use the same point or typed-column path as other point-cloud formats."
  tone="blue"
  items={[
    {label: 'Header', value: 'Fields, dimensions, point count, viewpoint, and storage layout.'},
    {label: 'Encodings', value: 'ASCII, binary, and the format-specific binary-compressed variant.'},
    {label: 'Output', value: 'PointCloud objects or Mesh Arrow tables.'},
    {label: 'Write', value: 'Encode compatible point data as ASCII PCD text.'}
  ]}
/>

<ReferenceBoundary
  title="PCD format and API details"
  description="The reference below documents header fields, supported encodings, decoded attributes, and loader/writer behavior."
  tone="blue"
/>

## Loaders and Writers

<div className="docs-api-card-grid">
  <a className="docs-api-card" href="/docs/modules/pcd/api-reference/pcd-loader">
    <span className="docs-api-card__kind">Loader</span>
    <strong>PCDLoader</strong>
    <span>Loads PCD point clouds as PointCloud objects or Mesh Arrow tables.</span>
    <span className="docs-api-card__meta">Output: PointCloud, Mesh Arrow table</span>
    <span className="docs-api-card__meta">APIs: load, parse, parseSync</span>
  </a>
  <a className="docs-api-card" href="/docs/modules/pcd/api-reference/pcd-writer">
    <span className="docs-api-card__kind">Writer</span>
    <strong>PCDWriter</strong>
    <span>Writes Mesh or Mesh Arrow table point clouds as ASCII PCD text.</span>
    <span className="docs-api-card__meta">Input: Mesh, Mesh Arrow table</span>
    <span className="docs-api-card__meta">APIs: encode, encodeSync, encodeTextSync</span>
  </a>
</div>

| Characteristic       | Value                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------ |
| File Format          | [Point Cloud Data](/docs/modules/pcd/formats/pcd)                                          |
| Data Format          | [PointCloud](/docs/specifications/category-mesh), [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables) |
| File Extension       | `.pcd`                                                                                     |
| MIME Type            | Not standardized                                                                           |
| File Type            | Text/Binary                                                                                |
| Loader Decoder Type  | Synchronous                                                                                |
| Loader Worker Thread | Yes                                                                                        |
| Loader Streaming     | No                                                                                         |
| Writer File Type     | Text                                                                                       |
| Writer APIs          | `encode`, `encodeSync`, `encodeTextSync`                                                   |

## Supported Encodings

PCD files have an ASCII header. Point records can be stored as ASCII, binary, or compressed binary data. `PCDWriter` currently writes ASCII PCD text.

## Point Cloud Data

PCD files are organized around named numeric fields. `PCDLoader` maps common fields such as `x`, `y`, `z`, normals, and color data to PointCloud attributes by default, or Mesh Arrow table columns when `pcd.shape: 'arrow-table'` is selected.
