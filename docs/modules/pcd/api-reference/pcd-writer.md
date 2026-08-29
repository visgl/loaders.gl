---
title: PCDWriter
description: Encode point-cloud data as ASCII Point Cloud Data text.
hide_title: true
page_style: designed
---

import {PcdDocsTabs} from '@site/src/components/docs/pcd-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="PCD module · writer API"
  title="PCDWriter"
  description="Encode loaders.gl mesh or Mesh Arrow table point clouds as readable Point Cloud Data text, preserving common position, normal, and color attributes."
  tone="violet"
  meta={['From v5.0', 'PCD 0.7', 'ASCII output']}
  links={[
    {label: 'PCD format', to: '/docs/modules/pcd/formats/pcd'},
    {label: 'PCDLoader', to: '/docs/modules/pcd/api-reference/pcd-loader'},
    {label: 'PCD module', to: '/docs/modules/pcd'}
  ]}
/>

<PcdDocsTabs active="pcdwriter" />

<DocOrientation
  eyebrow="What it writes"
  title="Export point attributes in a format tools can inspect."
  description="PCDWriter accepts the same point-cloud table family used by loaders.gl readers and writes an ASCII PCD header plus point records."
  tone="violet"
  items={[
    {label: 'Input', value: 'Mesh or Mesh Arrow table'},
    {label: 'Output', value: 'ASCII Point Cloud Data text'},
    {label: 'Attributes', value: 'Positions, normals, and packed color'},
    {label: 'Boundary', value: 'Readable output, not compressed binary'}
  ]}
/>

<ReferenceBoundary
  title="PCDWriter reference"
  description="The sections below document usage, input normalization, supported attributes, and current options."
  tone="violet"
/>

The `PCDWriter` writes [Mesh](/docs/specifications/category-mesh) or [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables) point cloud data as ASCII Point Cloud Data (PCD) text.

## Usage

```typescript
import {encode} from '@loaders.gl/core';
import type {Mesh, MeshArrowTable} from '@loaders.gl/schema';
import {PCDWriter} from '@loaders.gl/pcd';

declare const pointCloud: Mesh | MeshArrowTable;

const arrayBuffer = await encode(pointCloud, PCDWriter);
const text = PCDWriter.encodeTextSync(pointCloud);
```

## Data Format

`PCDWriter` accepts Mesh Arrow tables and legacy Mesh objects. Legacy Mesh input is normalized through the Mesh Arrow table conversion path before PCD text is encoded.

The writer requires a `POSITION` attribute. It writes `NORMAL` and `COLOR_0` attributes when present. Colors are packed into the PCD `rgb` float field convention.

## Options

`PCDWriter` does not currently define format-specific options.
