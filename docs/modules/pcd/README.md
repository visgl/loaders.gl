---
title: PCD module
description: Load and write Point Cloud Data with named point attributes and multiple encodings.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Point-cloud format"
  title="Keep point attributes alongside positions."
  description="The PCD module reads Point Cloud Data headers and point records, preserving named fields such as normals, color, intensity, and sensor-oriented metadata for downstream applications."
  tone="violet"
  meta={['PCD 0.7', 'Point attributes', 'ASCII and binary']}
  links={[
    {label: 'PCD format', to: '/docs/modules/pcd/formats/pcd'},
    {label: 'PCDLoader', to: '/docs/modules/pcd/api-reference/pcd-loader'}
  ]}
/>

<DocOrientation
  eyebrow="The point record"
  title="Describe the fields before decoding the points."
  description="PCD puts a compact schema in an ASCII header and lets the payload use ASCII, binary, or compressed binary storage. loaders.gl maps that description into reusable point-cloud data."
  tone="violet"
  items={[
    {label: 'Header', value: 'Fields, sizes, types, counts, and organization'},
    {label: 'Payload', value: 'ASCII, binary, or binary-compressed records'},
    {label: 'Attributes', value: 'Coordinates, normals, color, intensity, and custom fields'},
    {label: 'Output', value: 'Point-cloud objects or Mesh Arrow tables'}
  ]}
/>

The `@loaders.gl/pcd` module handles the the [Point Cloud Data](/docs/modules/pcd/formats/pcd), which stores 3D point cloud data).

<ReferenceBoundary
  title="PCD module reference"
  description="The sections below cover installation, supported loader and writer entry points, and parser attribution."
  tone="violet"
/>

## Installation

```bash
npm install @loaders.gl/pcd
npm install @loaders.gl/core
```

## Loaders and Writers

| Loader or Writer                                              | Description                                  |
| ------------------------------------------------------------- | -------------------------------------------- |
| [`PCDLoader`](/docs/modules/pcd/api-reference/pcd-loader)      | Loads PCD point clouds as PointCloud objects or Mesh Arrow tables. |
| [`PCDWriter`](/docs/modules/pcd/api-reference/pcd-writer)      | Writes Mesh or Mesh Arrow table point clouds as ASCII PCD text. |

## Attribution

PCDLoader is a fork of the THREE.js PCDLoader under MIT License. The forked THREE.js source files contained the following attributions:

- @author Filipe Caixeta / http://filipecaixeta.com.br
- @author Mugen87 / https://github.com/Mugen87
