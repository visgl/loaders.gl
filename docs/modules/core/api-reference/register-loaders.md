# registerLoaders

> **Deprecated** — It is recommended that applications manage loader registration explicitly (for example, by passing loaders directly to `load` and `parse`). This function may be removed in loaders.gl v5.

The loader registry allows applications to cherry-pick which loaders to include in their application bundle by importing just the loaders they need and registering them during initialization.

Applications can then make all those imported loaders available (via format autodetection) to all subsequent `parse` and `load` calls, without those calls having to specify which loaders to use. Because `registerLoaders()` mutates global state and erases loader types, prefer managing registration in your application code:

```typescript
// centralize loader registration in your application instead of relying on the global registry
import {parse} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';

export const applicationLoaders = [CSVLoader];

// pass the loaders to each call site
const result = await parse('data.csv', applicationLoaders);
```

## Usage

Sample application initialization code that imports and registers loaders:

```typescript
import {registerLoaders} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';

registerLoaders(CSVLoader);
```

Some other file that needs to load CSV:

```typescript
import {load} from '@loaders.gl/core';

// The pre-registered CSVLoader gets auto selected based on file extension...
const data = await load('data.csv');
```

## Functions

### registerLoaders()

```typescript
registerLoaders(loaders : Loader | Loader[])
```

Registers one or more _loader objects_ to a global _loader object registry_, these loaders will be used if no loader object is supplied to `parse` and `load`.

- `loaders` - can be a single loader or an array of loaders. The specified loaders will be added to any previously registered loaders.
