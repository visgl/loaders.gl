# parseSync

> Synchronous parsing is not supported by all loaders. Refer to the documentation for each loader.

For supporting loaders, the synchronous `parseSync` function works on already loaded data.

## Usage

```js
import {fetchFile, parseSync} from '@loaders.gl/core';
import {OBJLoader} from '@loaders.gl/obj';

const response = await fetchFile(url);
const arraybuffer = await response.arrayBuffer();

data = parseSync(arraybuffer, OBJLoader);
// Application code here
...
```

Handling errors

```js
try {
  const data = await parseSync(data);
} catch (error) {
  console.log(error);
}
```

## Functions

### `parseSync(data: ArrayBuffer | String, loaders: Loader | Loader[], options?: LoaderOptions, url?: String]]) : any`

Parses data synchronously using the provided loader, if possible. If not, returns `null`, in which case asynchronous parsing is required.

- `data`: already loaded data, either in binary or text format. This parameter can be any of the following types:
  - `Response`: `fetch` response object returned by `fetchFile` or `fetch`.
  - `ArrayBuffer`: Parse from binary data in an array buffer
  - `String`: Parse from text data in a string. (Only works for loaders that support textual input).
  - `Iterator`: Iterator that yeilds binary (`ArrayBuffer`) chunks or string chunks (string chunks only work for loaders that support textual input).
    can also be supplied.
- `loaders`: can be a single loader or an array of loaders. If ommitted, will use the list of registered loaders (see `registerLoaders`)
- `options`: See [`LoaderOptions`](./loader-options).
- `url`: optional, assists in the autoselection of a loader if multiple loaders are supplied to `loader`.

Returns:

- Return value depends on the _loader object_ category
