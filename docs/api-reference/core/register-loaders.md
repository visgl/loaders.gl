# registerLoaders

The loader registry allows applications to cherry-pick which loaders to include in their application bundle by importing just the loaders they need and registering them during initialization.

Applications can then make all those imported loaders available (via format autodetection) to all subsequent `parse` and `load` calls, without those calls having to specify which loaders to use.

## Usage

Initialization imports and registers loaders:

```js
import {registerLoaders} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';

registerLoaders(CSVLoader);
```

Some other file that needs to load CSV:

```js
import {load} from '@loaders.gl/core';

// The pre-registered CSVLoader gets auto selected based on file extension...
const data = await load('data.csv');
```

## Functions

### registerLoaders(loaders : Object | Object[])

Registers one or more _loader objects_ to a global _loader object registry_, these loaders will be used if no loader object is supplied to `parse` and `load`.

- `loaders` - can be a single loader or an array of loaders. The specified loaders will be added to any previously registered loaders.
