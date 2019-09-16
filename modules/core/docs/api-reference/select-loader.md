# selectLoader

> `selectLoader` is considered experimental as loader auto detection is still being improved.

A core feature of loaders.gl is the ability to automatically select an appropriate loader for a specific file among a list of candidate loaders. This feature is built-in to the `parse` and `load` functions, but applications can also access this feature directly through the `selectLoader` API.

Loader selection heuristics are based on both filename (url) extensions as well as comparison of initial data content against known headers for each file format.

`selectLoader` is also aware of the [loader registry](docs/api-reference/core/register-loaders.md). If no loaders are provided (by passing in a falsy value such as `null`) `selectLoader` will search the list of pre-registered loaders.

## Usage

Select a loader from a list of provided loaders:

```js
import {_selectLoader} from '@loaders.gl/core';
import {ArrowLoader} from '@loaders.gl/arrow';
import {CSVLoader} from '@loaders.gl/csv';

_selectLoader([ArrowLoader, CSVLoader], 'filename.csv'); // => CSVLoader
```

Select a loader from pre-registered loaders in the loader registry:

```js
import {registerLoaders, _selectLoader} from '@loaders.gl/core';
import {ArrowLoader} from '@loaders.gl/arrow';
import {CSVLoader} from '@loaders.gl/csv';

registerLoaders(ArrowLoader, CSVLoader);

// By passing null instead of a loader list, selectLoader returns null.
_selectLoader(null, 'filename.csv'); // => CSVLoader
```

## Functions

### \_selectLoader(loaders : Object | Object[] | null, url? : String, data? : ArrayBuffer | String, options? : Object)

Selects an appropriate loader for a file from a list of candidate loaders by examining a URL and/or an initial data chunk.

Parameters:

- `loaders` - can be a single loader or an array of loaders, or null.
- `url` - An optional URL to perform autodetection against.
- `data` - Optional data to perform autodetection against
- `options.nothrow`=`false` - Return null instead of throwing exception if no loader can be found

Returns:

- A single loader (or null if `options.nothrow` was set and no matching loader was found).

Throws:

- If no matching loader was found, and `options.nothrow` was not set.

Regarding the `loaders` parameter:

- A single loader object will be returned without matching.
- a `null` loader list will use the pre-registered list of loaders.
- A supplied list of loaders will be searched for a matching loader.

## Remarks

- File extensions - An attempt will be made to extract a file extension by stripping away query parameters and base path before matching against known loader extensions.
- Stream autodetection - Currently not well supported.
