import {LasDocsTabs} from '@site/src/components/docs/las-docs-tabs';

# LAS Format

<LasDocsTabs active="format" />

| Characteristic       | Value                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------ |
| File Format          | [LAS / LAZ](/docs/modules/las/formats/las)                                                  |
| Data Format          | [PointCloud](/docs/specifications/category-mesh), [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables) |
| File Extensions      | `.las`, `.laz`                                                                             |
| MIME Type            | Not standardized                                                                           |
| File Type            | Binary                                                                                     |
| Loader APIs          | `load`, `parse`, `parseSync`                                                               |
| Loader Worker Thread | Yes                                                                                        |
| Loader Streaming     | No                                                                                         |
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

## Variants

LAS stores uncompressed point cloud data. LAZ is the lossless compressed variant.

## Support

`@loaders.gl/las` supports LAS and LAZ files up to LAS v1.3. LAS v1.4 is not currently supported.
