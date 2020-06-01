# selectLoader

A core feature of loaders.gl is the ability to automatically select an appropriate loader for a specific resource among a list of candidate loaders. This feature is built-in to the `parse` and `load` functions, but applications can also access this feature directly through the `selectLoader` API.

Loader selection heuristics are based on both filename (url) extensions as well as comparison of initial data content against known headers for each file format.

`selectLoader` is also aware of the [loader registry](docs/api-reference/core/register-loaders.md). If no loaders are provided (by passing in a falsy value such as `null`) `selectLoader` will search the list of pre-registered loaders.

## Usage

Select a loader from a list of provided loaders:

```js
import {selectLoader} from '@loaders.gl/core';
import {ArrowLoader} from '@loaders.gl/arrow';
import {CSVLoader} from '@loaders.gl/csv';

selectLoader('filename.csv', [ArrowLoader, CSVLoader]); // => CSVLoader
```

Select a loader from pre-registered loaders in the loader registry:

```js
import {registerLoaders, selectLoader} from '@loaders.gl/core';
import {ArrowLoader} from '@loaders.gl/arrow';
import {CSVLoader} from '@loaders.gl/csv';

registerLoaders(ArrowLoader, CSVLoader);

selectLoader('filename.csv'); // => CSVLoader
```

## Functions

### selectLoader(data: Response | ArrayBuffer | String, loaders?: Object | Object[] | null, options?: Object, info?: Object)

Selects an appropriate loader for a file from a list of candidate loaders by examining the `data` parameter, looking at URL extension, mimeType ('Content-Type') and/or an initial data chunk.

Parameters:

- `data` - data to perform autodetection against
- `loaders` - can be a single loader or an array of loaders, or null.
- `options.nothrow`=`false` - Return null instead of throwing exception if no loader can be found

Returns:

- A single loader (or `null` if `options.nothrow` was set and no matching loader was found).

Throws:

- If no matching loader was found, and `options.nothrow` was not set.

Regarding the `loaders` parameter:

- A single loader object will be returned without matching.
- a `null` loader list will use the pre-registered list of loaders.
- A supplied list of loaders will be searched for a matching loader.

## Supported Formats

- strings / non-data urls:
- strings / data urls: The mime type will be extracted from the data url prologue (if available)
- fetch `Response` objects: `url` and `headers.get('Content-Type')` fields will be used.
- `File` and `Blob` objects:

Peeking into batched input sources is not supported directly by `selectLoader`:

- `Response`: Avoids requesting initial data to make sure the response body is not marked as used.
- `Stream`: It is not possible to non-destructively peek into a stream.
- `Iterator/AsyncIterator`: it is not possible to peek into an iterator.

Instead use helpers to get access to initialContents and pass it in separately.

## Remarks

- File extensions - An attempt will be made to extract a file extension by stripping away query parameters and base path before matching against known loader extensions.
- Stream autodetection - Currently not well supported.
