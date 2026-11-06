---
title: "IES — measured light distributions"
description: "Keep photometric measurements and scaling separate from light objects."
hide_title: true
page_style: designed
---

{/* SPDX-License-Identifier: MIT */}
{/* Copyright (c) vis.gl contributors */}

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="images format"
  title="IES — measured light distributions"
  description="Keep photometric measurements and scaling separate from light objects."
  tone="pink"
  meta={["IESLoader","Renderer-independent output","Explicit initial scope"]}
  links={[{label: 'images module', to: '/docs/modules/images'}]}
/>

<DocOrientation
  eyebrow="Format feature card"
  title="Read IES as data."
  description="No normalization, symmetry expansion or external tilt fetches"
  tone="pink"
  items={[{"label":"Input","value":"LM-63-1991/1995/2002; Type C; TILT=NONE"},{"label":"Output","value":"IESProfile with Float64 angles and raw candela samples"},{"label":"Loader","value":"IESLoader · @loaders.gl/images"},{"label":"Parser","value":"@loaders.gl/images/ies-loader"}]}
/>

:::note Availability

This page documents the initial implementation in [PR #4412](https://github.com/visgl/loaders.gl/pull/4412). Use a version containing that change; this guide does not imply availability in older published versions.

:::

<ReferenceBoundary
  title="Format, usage and output reference"
  description="Understand the source data, load it through the public entry point, and check the supported subset before integrating it."
  tone="pink"
/>

## What is an IES profile?

An IES LM-63 file describes a measured luminaire distribution: luminous intensity sampled over vertical and horizontal angles, plus lamp, electrical, and dimensional metadata. It is useful for inspecting or reproducing a fixture's angular light output. It is not a texture file or a complete renderer light definition.

Candela measures luminous intensity in a direction. Lumens per lamp, rated watts, dimensions, and ballast fields are separate measurements; they are not interchangeable normalization factors. The file's photometric type establishes angular conventions.

## Load and scale a measured sample

```typescript
import {load} from '@loaders.gl/core';
import {IESLoader} from '@loaders.gl/images';

const profile = await load('fixture.ies', IESLoader);
const verticalIndex = 0;
const horizontalIndex = 0;
const index = horizontalIndex * profile.verticalAngles.length + verticalIndex;
const candela = profile.candelaValues[index] * profile.candelaMultiplier;
```

The angle arrays are degrees. Vertical angle varies fastest in the sample array. Do not normalize by the brightest sample unless that is an intentional downstream choice.

## Output contract

| Field | Meaning |
| --- | --- |
| `revision`, `labels` | Authored LM-63 revision and header label/comment records |
| `verticalAngles`, `horizontalAngles` | Float64 angle samples; horizontal origin is preserved |
| `candelaValues`, `candelaMultiplier` | Raw Float64 values and their conversion multiplier |
| `photometricType` | 1, the supported Type C distribution |
| `lampCount`, `lumensPerLamp` | Lamp metadata; -1 lumens denotes absolute photometry |
| `dimensions`, `dimensionUnit` | Authored width/length/height and feet/meters unit |
| `ballastFactor`, `auxiliaryFactor` | Revision-dependent fields retained separately |
| `inputWatts` | Rated input power |

## Supported features and limits

LM-63-1991, 1995, and 2002 Type C profiles with TILT=NONE are supported. Unsupported revisions, Type A/B, embedded tilt payloads, and external tilt files reject. External files are never fetched.

Numeric headers, angle ordering, dimensions, and exact sample counts are checked. Parsing preserves the authored angular extent; it does not expand symmetric distributions into a full sphere, shift the angular origin, interpolate, normalize, generate a texture, or create a light. Applications must implement those transformations according to their own photometric and renderer conventions.

## Direct parsing

```typescript
import {parseSync} from '@loaders.gl/core';
import {IESLoaderWithParser} from '@loaders.gl/images/ies-loader';

const profile = parseSync(text, IESLoaderWithParser);
```

The root metadata loader preloads the implementation for async core APIs. There are no format-specific options or new package dependencies. Although the implementation belongs to images for lighting assets, its output is numerical photometry, not decoded pixels.
