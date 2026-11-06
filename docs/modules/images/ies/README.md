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
  description="Raw loader output; opt-in CPU photometric calculations"
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

Numeric headers, angle ordering, dimensions, and exact sample counts are checked. Parsing preserves the authored angular extent; it does not expand symmetric distributions into a full sphere, shift the angular origin, interpolate, normalize, generate a texture, or create a light. The opt-in lighting utilities below provide numerical sampling and integration; applications choose renderer conventions.

## Direct parsing

```typescript
import {parseSync} from '@loaders.gl/core';
import {IESLoaderWithParser} from '@loaders.gl/images/ies-loader';

const profile = parseSync(text, IESLoaderWithParser);
```

The root metadata loader preloads the implementation for async core APIs. There are no format-specific options or new package dependencies. Although the implementation belongs to images for lighting assets, its output is numerical photometry, not decoded pixels.

## Photometric calculations

The explicit `@loaders.gl/images/lighting` entry point provides pure numerical helpers.
The package root remains metadata-only. Loading an IES file still returns its authored
samples; these operations run only when called and add no dependencies.

```typescript
import {load} from '@loaders.gl/core';
import {IESLoader} from '@loaders.gl/images';
import {createIESSampler, integrateIESProfile, resampleIESProfile} from '@loaders.gl/images/lighting';

const profile = await load('luminaire.ies', IESLoader);
const sample = createIESSampler(profile);
const candela = sample(45, 120); // vertical, horizontal; degrees
const lumens = integrateIESProfile(profile);
const grid = resampleIESProfile(profile, {
  verticalCount: 181,
  horizontalCount: 360,
  normalization: 'peak'
});
```

### Sampling and units

`createIESSampler(profile)` snapshots the angles and intensities. Later source mutations
do not change the sampler. It applies `candelaMultiplier` once and interpolates bilinearly
between measured angular knots. Inputs are vertical degrees in `[0, 180]` and any finite
horizontal degree angle; azimuth wraps. Unmeasured vertical directions return zero.
Angles stay in the authored photometric convention; no world-axis transform is imposed.

Supported horizontal extents are a single rotational plane, mirrored `0–90`, `0–180`
or `90–270` degrees, and full `0–360` degrees. Other extents reject rather than guessing
symmetry. The `90–270` convention preserves its angular origin. The
[Radiance IES converter](https://github.com/NREL/Radiance/blob/master/src/cv/ies2rad.c)
documents the Type C symmetry cases. These helpers implement their own numerical algorithms.

Lamp count, lumens-per-lamp and ballast metadata are not automatically applied as additional
scales. Callers that need operating-condition adjustments can choose those factors explicitly.
Sampling preserves measured candela; peak normalization produces relative values instead.

### Luminous flux

`integrateIESProfile(profile)` returns lumens by integrating the piecewise bilinear angular
interpolant over solid angle: `∫∫ I(θ, φ) sin(θ) dθ dφ`, with integration angles in radians.
It uses measured, possibly nonuniform intervals and analytical vertical weights, then expands
the supported horizontal symmetry. For example, an isotropic 1-candela profile integrates
to `4π` lumens. The result describes the sampled interpolant; it does not reconstruct missing
measurements, infer a near-field luminaire shape or apply exposure/renderer light settings.
Nonfinite inputs and numeric overflow reject.

### Regular angular grids

`resampleIESProfile(profile, options)` returns an `IESGrid`:

| Field | Meaning |
| --- | --- |
| `width`, `height` | Vertical samples per row and horizontal rows |
| `data` | Float64 samples, vertical angle fastest: `horizontalIndex * width + verticalIndex` |
| `verticalAngles` | Degrees from 0 through 180, including both poles |
| `horizontalAngles` | Degrees in `[0, 360)`, excluding a duplicate seam |
| `unit` | `candela` by default; `relative` for peak normalization |
| `peakCandela` | Measured peak before normalization |

Defaults are 181 vertical and 360 horizontal samples. Vertical count must be at least two;
horizontal count at least one. The product is bounded to 4,194,304 samples. Arrays belong
to the result and no GPU textures are allocated. `normalization: 'peak'` divides by the
measured peak, not by the largest resampled pixel. Zero distributions remain zero;
subnormal positive peaks are handled without an infinite reciprocal. The other mode,
`'none'`, retains candela.
