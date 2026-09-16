---
title: Styling and feature access
description: Build renderer-neutral 3D Tiles style inputs from metadata, feature IDs, and batch tables.
hide_title: true
page_style: designed
---

import {Tiles3DDocsTabs} from '@site/src/components/docs/tiles-3d-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="3D Tiles metadata / R2"
  title="Prepare style inputs without coupling the loader to a renderer."
  description="The loader exposes stable property and feature contracts. A renderer can evaluate styles and upload resources later, without reaching into private payload layouts."
  tone="violet"
  meta={['Metadata precedence', 'Feature IDs', 'Renderer boundary']}
/>

<Tiles3DDocsTabs active="runtime" />

<DocOrientation
  eyebrow="A deliberate boundary"
  title="Resolve data first; evaluate style later."
  description="The R2 contract turns decoded rows and legacy batch tables into a predictable property bag. It does not parse a style language, coerce types, pick colors, or allocate GPU buffers."
  tone="violet"
  items={[
    {label: 'Preserve', value: 'Raw metadata entities and feature-ID declarations remain available.'},
    {label: 'Resolve', value: 'Property-table rows and hierarchy-aware batch-table values can be read by name.'},
    {label: 'Compose', value: 'A style-input snapshot records values and their source scope.'},
    {label: 'Render', value: 'Applications decide expressions, defaults, picking, and GPU policy.'}
  ]}
/>

<ReferenceBoundary
  title="Use the contract at the application boundary"
  description="Start from a Tile3D content entry, resolve the feature row you need, and pass the resulting snapshot into your renderer or styling system."
  tone="violet"
/>

The @loaders.gl/3d-tiles APIs in this guide are intentionally renderer-neutral. They make metadata and feature access explicit while preserving the existing Tile3D.content, Tile3D.contents, raw extension objects, and batch-table classes.

## Build a style input

~~~ts
import {
  createTile3DStyleInput,
  getTile3DStyleProperty
} from '@loaders.gl/3d-tiles';

const content = tile.contentEntries[0];
const styleInput = createTile3DStyleInput(content, tile.metadataContext, {
  featureId: 12,
  batchTable: decodedBatchTable
});

const height = getTile3DStyleProperty(styleInput, 'height');
~~~

Tile3DStyleInput contains:

| Field | Meaning |
| --- | --- |
| featureId | The optional feature row used for batch-table lookup. |
| metadata | The original tileset/group/tile/content/subtree references. |
| properties | A plain read-only snapshot suitable for a renderer or application adapter. |
| propertySources | The scope that supplied each value, useful for diagnostics and fallback UI. |

Metadata properties are merged from broad to narrow scope:

1. tileset metadata
2. group metadata
3. tile metadata
4. content metadata
5. batch-table properties for the selected feature

The most specific defined value wins. A batch-table hierarchy row therefore overrides tile metadata, while inherited hierarchy properties are still visible through the batch-table getProperty and getPropertyNames methods.

## Access structural metadata rows

Structural metadata columns must already be decoded by glTF parsing. getStructuralMetadataRow returns one row and applies class default values and noData sentinels. getStructuralMetadataProperty is the named-value convenience form:

~~~ts
import {getStructuralMetadataProperty} from '@loaders.gl/3d-tiles';

const value = getStructuralMetadataProperty(
  propertyTable,
  schemaClass,
  featureId,
  'height'
);
~~~

These helpers preserve typed arrays for vector and array values. They do not map a row to a feature ID automatically; use the EXT_mesh_features declaration in the content descriptor to select the appropriate row.

## Access batch-table and hierarchy properties

Legacy b3dm, i3dm, and pnts batch tables expose getProperty, getPropertyNames, hasProperty, and class queries. getTile3DBatchTableProperties copies the visible row into a plain object:

~~~ts
import {getTile3DBatchTableProperties} from '@loaders.gl/3d-tiles';

const properties = getTile3DBatchTableProperties(batchTable, featureId);
~~~

When 3DTILES_batch_table_hierarchy is present, the batch-table implementation walks inherited parents and returns the nearest defined property. Binary hierarchy accessors that are not supported still fail explicitly rather than silently producing incomplete style data. This tranche does not change hierarchy storage, feature picking, or renderer draw behavior.

## Feature IDs are declarations, not styling

Tile3DContent.featureIds contains normalized declarations from supported payloads, including attribute, constant, property-table, texture, and implicit sources. A declaration tells an application where an identifier comes from; it is not the identifier value for every vertex or feature. Applications remain responsible for:

- mapping an attribute or texture to a feature row;
- deciding how a constant ID applies to a primitive;
- joining a property-table row with its schema class;
- handling unsupported extension forms preserved in raw metadata;
- evaluating color, visibility, filters, and picking policy.

The loader never evaluates a Cesium style expression or assumes a particular GPU buffer layout.

## Decoded values versus preserved metadata

There are two useful levels of access:

| Level | API | What is guaranteed |
| --- | --- | --- |
| Preserved | Tile3D.metadataContext, Tile3DContent.metadata, raw extension objects | Authored references and unknown fields remain inspectable; binary values may still be encoded. |
| Decoded | getStructuralMetadataRow, getStructuralMetadataProperty, batch-table accessors | Values are available after the relevant parser has decoded them; defaults and noData are applied where specified. |

Do not treat a preserved metadata reference as a decoded property bag. Conversely, do not mutate a decoded row expecting the source metadata or another tile to change.

## Limitations and diagnostics

- Style inputs are snapshots. Rebuild them after metadata or content reload.
- Invalid or missing feature IDs skip batch-table lookup; the raw content and metadata remain available.
- Property precedence is deterministic but does not implement a style-language fallback such as defined() or color().
- Property-table values require glTF buffer loading and a supported component/type profile.
- Unknown optional extensions remain available, while unsupported required extensions are rejected at parse time.
- I3S LOD metrics and metadata remain separate from 3D Tiles styling inputs.

For traversal and render visibility, see [screen-space error and LOD](./screen-space-error-and-lod) and [3D Tiles correctness and conformance](./correctness-and-conformance). For the public content and feature contracts, see the [Tile3D API](/docs/modules/tiles/api-reference/tile-3d) and [3D Tiles format compatibility](../formats/3d-tiles).
