Core loader registry

# Make a known loader set available to legacy call sites.

`registerLoaders` adds loader metadata to the global registry so later `load` and `parse` calls can select by format. It remains available for compatibility; new applications should generally pass their loader list explicitly.

[Core module](https://loaders.gl/next/docs/modules/core.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core.md)[Using loaders](https://loaders.gl/next/docs/developer-guide/using-loaders.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-loaders.md)[Load API](https://loaders.gl/next/docs/modules/core/api-reference/load.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/api-reference/load.md)

The registry boundary

## Import the loaders once. Let format detection find them.

Registration is a convenience layer around explicit loader lists. Because it mutates global state, it can obscure dependencies and erase useful type information in larger applications.

01

Import

Only the loaders the application needs

02

Register

Add them to the process-wide registry

03

Detect

Choose by URL, extension, or content

04

Prefer

Explicit loader lists for new code

> **Deprecated** — It is recommended that applications manage loader registration explicitly (for example, by passing loaders directly to `load` and `parse`). This function may be removed in loaders.gl v5.

The loader registry allows applications to cherry-pick which loaders to include in their application bundle by importing just the loaders they need and registering them during initialization.

Applications can then make all those imported loaders available (via format autodetection) to all subsequent `parse` and `load` calls, without those calls having to specify which loaders to use. Because `registerLoaders()` mutates global state and erases loader types, prefer managing registration in your application code:

Detailed guide

## Registry behavior and migration details

The reference below covers registration, auto-selection, global state, and the explicit-loader pattern recommended for new applications.

```
// centralize loader registration in your application instead of relying on the global registry

import {load} from '@loaders.gl/core';

import {CSVLoader} from '@loaders.gl/tables/csv';



export const applicationLoaders = [CSVLoader];



// pass the loaders to each call site

const result = await load('data.csv', applicationLoaders);
```

## Usage[​](#usage "Direct link to Usage")

Sample application initialization code that imports and registers loaders:

```
import {registerLoaders} from '@loaders.gl/core';

import {CSVLoader} from '@loaders.gl/tables/csv';



registerLoaders(CSVLoader);
```

Some other file that needs to load CSV:

```
import {load} from '@loaders.gl/core';



// The pre-registered CSVLoader gets auto selected based on file extension...

const data = await load('data.csv');
```

## Functions[​](#functions "Direct link to Functions")

### registerLoaders()[​](#registerloaders "Direct link to registerLoaders()")

```
registerLoaders(loaders : Loader | Loader[])
```

Registers one or more *loader objects* to a global *loader object registry*, these loaders will be used if no loader object is supplied to `parse` and `load`.

* `loaders` - can be a single loader or an array of loaders. The specified loaders will be added to any previously registered loaders.
