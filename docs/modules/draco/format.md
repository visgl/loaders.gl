import {DracoDocsTabs} from '@site/src/components/docs/draco-docs-tabs';

# Draco Format

<DracoDocsTabs active="format" />

| Characteristic       | Value                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------ |
| File Format          | [Draco](/docs/modules/draco/formats/draco)                                                  |
| Data Format          | [Mesh](/docs/specifications/category-mesh), [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables) |
| File Extension       | `.drc`                                                                                     |
| MIME Type            | `application/octet-stream`                                                                 |
| File Type            | Binary                                                                                     |
| Loader APIs          | `load`, `parse`, `parseSync`                                                               |
| Loader Worker Thread | Yes                                                                                        |
| Loader Streaming     | No                                                                                         |
| Writer APIs          | `encode`, `encodeSync`                                                                     |

## Loaders and Writers

<div className="docs-api-card-grid">
  <a className="docs-api-card" href="/docs/modules/draco/api-reference/draco-loader">
    <span className="docs-api-card__kind">Loader</span>
    <strong>DracoLoader</strong>
    <span>Loads Draco meshes and point clouds as Mesh objects.</span>
    <span className="docs-api-card__meta">Output: Mesh</span>
    <span className="docs-api-card__meta">APIs: load, parse, parseSync</span>
  </a>
  <a className="docs-api-card" href="/docs/modules/draco/api-reference/draco-loader">
    <span className="docs-api-card__kind">Loader</span>
    <strong>DracoArrowLoader</strong>
    <span>Loads Draco meshes and point clouds as Mesh Arrow tables.</span>
    <span className="docs-api-card__meta">Output: Mesh Arrow table</span>
    <span className="docs-api-card__meta">APIs: load, parse, parseSync</span>
  </a>
  <a className="docs-api-card" href="/docs/modules/draco/api-reference/draco-writer">
    <span className="docs-api-card__kind">Writer</span>
    <strong>DracoWriter</strong>
    <span>Encodes Mesh or Mesh Arrow table data as Draco binary data.</span>
    <span className="docs-api-card__meta">Input: Mesh, Mesh Arrow table</span>
    <span className="docs-api-card__meta">APIs: encode, encodeSync</span>
  </a>
</div>

## Encodings

Draco stores compressed mesh and point cloud geometry. It supports triangle meshes and point clouds, and can preserve supported attribute arrays and metadata dictionaries.

## Runtime

`DracoLoader` and `DracoWriter` use the Draco3D decoder and encoder runtimes. These runtimes are loaded dynamically by default and can be supplied through `options.modules`.
