# Loader Registry

The loader registry allows applications to cherry-pick which loaders to include in their application bundle by importing just the loaders they need and registering them during initialization.

Applications can then make all those imported loaders available (via format autodetection) to all subsequent `parseFile` and `loadFile` calls, without those calls having to specify which loaders to use.

## Usage

Initialization imports and registers loaders:
```js
import {registerLoaders} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';

registerLoaders(CSVLoader);
```

Some other file that needs to load CSV:
```js
import {loadFile} from '@loaders.gl/core';

// The pre-registered SVLoader gets auto selected based on file extension...
const data = await loadFile('data.csv');
```

## Functions

### registerLoaders(loaders : Object | Object[])

Registers one or more *loader objects* to a global *loader object registry*, these loaders will be used if no loader object is supplied to `parseFile` and `loadFile`.

- `loaders` - can be a single loader or an array of loaders. The specified loaders will be added to any previously registered loaders.
