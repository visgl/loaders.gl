<!-- -->

<!-- -->

images format

# IES — measured light distributions

Keep photometric measurements and scaling separate from light objects.

[images module](https://loaders.gl/next/docs/modules/images.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/images.md)

Format feature card

## Read IES as data.

No normalization, symmetry expansion or external tilt fetches

01

Input

LM-63-1991/1995/2002; Type C; TILT=NONE

02

Output

IESProfile with Float64 angles and raw candela samples

03

Loader

IESLoader · @loaders.gl/images

04

Parser

@loaders.gl/images/ies

:::note Availability

This page documents the initial implementation in [PR #4412](https://github.com/visgl/loaders.gl/pull/4412). Use a version containing that change; this guide does not imply availability in older published versions.

:::

Detailed guide

## Format, usage and output reference

Understand the source data, load it through the public entry point, and check the supported subset before integrating it.

## What is an IES profile?[​](#what-is-an-ies-profile "Direct link to What is an IES profile?")

An IES LM-63 file describes a measured luminaire distribution: luminous intensity sampled over vertical and horizontal angles, plus lamp, electrical, and dimensional metadata. It is useful for inspecting or reproducing a fixture's angular light output. It is not a texture file or a complete renderer light definition.

Candela measures luminous intensity in a direction. Lumens per lamp, rated watts, dimensions, and ballast fields are separate measurements; they are not interchangeable normalization factors. The file's photometric type establishes angular conventions.

## Load and scale a measured sample[​](#load-and-scale-a-measured-sample "Direct link to Load and scale a measured sample")

```
import {load} from '@loaders.gl/core';

import {IESLoader} from '@loaders.gl/images';



const profile = await load('fixture.ies', IESLoader);

const verticalIndex = 0;

const horizontalIndex = 0;

const index = horizontalIndex * profile.verticalAngles.length + verticalIndex;

const candela = profile.candelaValues[index] * profile.candelaMultiplier;
```

The angle arrays are degrees. Vertical angle varies fastest in the sample array. Do not normalize by the brightest sample unless that is an intentional downstream choice.

## Output contract[​](#output-contract "Direct link to Output contract")

| Field                                | Meaning                                                  |
| ------------------------------------ | -------------------------------------------------------- |
| `revision`, `labels`                 | Authored LM-63 revision and header label/comment records |
| `verticalAngles`, `horizontalAngles` | Float64 angle samples; horizontal origin is preserved    |
| `candelaValues`, `candelaMultiplier` | Raw Float64 values and their conversion multiplier       |
| `photometricType`                    | 1, the supported Type C distribution                     |
| `lampCount`, `lumensPerLamp`         | Lamp metadata; -1 lumens denotes absolute photometry     |
| `dimensions`, `dimensionUnit`        | Authored width/length/height and feet/meters unit        |
| `ballastFactor`, `auxiliaryFactor`   | Revision-dependent fields retained separately            |
| `inputWatts`                         | Rated input power                                        |

## Supported features and limits[​](#supported-features-and-limits "Direct link to Supported features and limits")

LM-63-1991, 1995, and 2002 Type C profiles with TILT=NONE are supported. Unsupported revisions, Type A/B, embedded tilt payloads, and external tilt files reject. External files are never fetched.

Numeric headers, angle ordering, dimensions, and exact sample counts are checked. Parsing preserves the authored angular extent; it does not expand symmetric distributions into a full sphere, shift the angular origin, interpolate, normalize, generate a texture, or create a light. Applications must implement those transformations according to their own photometric and renderer conventions.

## Direct parsing[​](#direct-parsing "Direct link to Direct parsing")

```
import {parseSync} from '@loaders.gl/core';

import {IESLoaderWithParser} from '@loaders.gl/images/ies';



const profile = parseSync(text, IESLoaderWithParser);
```

The root metadata loader preloads the implementation for async core APIs. There are no format-specific options or new package dependencies. Although the implementation belongs to images for lighting assets, its output is numerical photometry, not decoded pixels.
