---
title: "NRRD — multidimensional sampled data"
description: "Read array samples and preserve the authored spatial mapping."
hide_title: true
page_style: designed
---

{/* SPDX-License-Identifier: MIT */}
{/* Copyright (c) vis.gl contributors */}

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="scientific format"
  title="NRRD — multidimensional sampled data"
  description="Read array samples and preserve the authored spatial mapping."
  tone="cyan"
  meta={["NRRDLoader","Renderer-independent output","Explicit initial scope"]}
  links={[{label: 'scientific module', to: '/docs/modules/scientific'}]}
/>

<DocOrientation
  eyebrow="Format feature card"
  title="Read NRRD as data."
  description="Axis zero varies fastest; no resampling or coordinate conversion"
  tone="cyan"
  items={[{"label":"Input","value":"NRRD 1–5; attached raw, ASCII/text and gzip"},{"label":"Output","value":"NRRDData with native typed samples, shape and header metadata"},{"label":"Loader","value":"NRRDLoader · @loaders.gl/scientific"},{"label":"Parser","value":"@loaders.gl/scientific/nrrd-loader"}]}
/>

:::note Availability

This page documents the initial implementation in [PR #4413](https://github.com/visgl/loaders.gl/pull/4413). Use a version containing that change; this guide does not imply availability in older published versions.

:::

<ReferenceBoundary
  title="Format, usage and output reference"
  description="Understand the source data, load it through the public entry point, and check the supported subset before integrating it."
  tone="cyan"
/>

## What is NRRD?

NRRD stores a multidimensional raster: a typed sequence of samples plus a text header describing dimensions, axis sizes, encoding, and optional spatial metadata. Medical volumes are one use, but axes can also represent time, vector components, or other nonspatial quantities. A three-dimensional array is not automatically an XYZ volume in a particular anatomical convention.

An attached file keeps the payload after the header's blank line. A detached header points to another file. The initial loader reads attached payloads only and never fetches a detached data file.

## Load an array

```typescript
import {load} from '@loaders.gl/core';
import {NRRDLoader} from '@loaders.gl/scientific';

const volume = await load('volume.nrrd', NRRDLoader);
console.log(volume.shape, volume.data.constructor.name);
console.log(volume.origin, volume.directions, volume.kinds);
```

## Output contract and indexing

| Field | Meaning |
| --- | --- |
| `data` | Int8/Uint8/Int16/Uint16/Int32/Uint32/Float32/Float64Array |
| `shape` | Source axis sizes, without axis permutation |
| `origin` | Optional world coordinate of the first sample |
| `directions` | Optional step vector per array axis; null marks a nonspatial axis |
| `kinds` | Authored axis kinds, when supplied |
| `fields` | Normalized header field names with their original textual values |
| `metadata` | Custom `key:=value` metadata |

For shape [width, height, depth], sample (x, y, z) is at `x + width * (y + height * z)`. More generally, axis zero varies fastest. When origin and all applicable spatial directions exist, the coordinate is origin plus the sum of each axis index times its direction vector. Nonspatial axes contribute no spatial step.

Space names, axis units, measurement frames, and spacings remain in header fields. The loader does not convert between anatomical conventions, apply measurement frames, choose a transfer function, or resample the array. Inspect the producer's metadata before treating indices as physical positions.

## Supported features and limits

| Supported | Unsupported |
| --- | --- |
| Attached NRRD versions 1–5 | Detached data files and file lists |
| Raw, ASCII/text and gzip samples | Hex, bzip2, block and other encodings |
| Signed/unsigned 8/16/32-bit integers; float32/64 | 64-bit integer storage |
| Binary endianness and spatial metadata | Nonzero byte/line skips, streaming, writing |

Multibyte binary samples require an endian field. ASCII values must be finite and representable in the declared type; float32 rounding is allowed. Header storage is bounded to 1 MiB and decoded sample storage to 256 MiB. Gzip output is bounded by the declared sample count. Both spaced and unspaced skip directives reject when nonzero; zero skips are accepted.

## Loader API and runtime

`NRRDLoader` is metadata-only. Import `NRRDLoaderWithParser` from `@loaders.gl/scientific/nrrd-loader` for direct async core parsing. It is not a sync loader, including for raw files. There are no format-specific options. Gzip uses native `DecompressionStream` support without a new codec dependency.

Choose [VTK](../vtk/README.md) when cells and point/cell fields are part of the dataset, or [NumPy NPY](../formats/npy.md) when the primary requirement is a NumPy array without NRRD's spatial header conventions.
