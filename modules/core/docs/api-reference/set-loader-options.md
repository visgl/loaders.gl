# setLoaderOptions

Set the supplied options onto the current global options object

## Usage

Bundling the entire `draco3d` library (instead of loading it on-demand from CDN):

```js
import draco from 'draco3d';
import {setLoaderOptions} from '@loaders.gl/core';
setLoaderOptions({
  modules: {
    draco3d
  }
});
```

## Functions

### setLoaderOptions(options : Object) : void

Merges the supplied options into the current global options

## Options

A loader object, that can contain a mix of options:

- options defined by the `parse` function can be specified.
- options specific to any loaders can also be specified (in loader specific sub-objects).

Please refer to the corresponding documentation page for for `parse` and for each loader for details.
