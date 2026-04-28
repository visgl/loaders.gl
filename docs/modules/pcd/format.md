import {PcdDocsTabs} from '@site/src/components/docs/pcd-docs-tabs';

# PCD Format

<PcdDocsTabs active="format" />

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
