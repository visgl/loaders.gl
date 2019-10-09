# setLoaderOptions

## Usage

Bundling the entire `draco3d` library:

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

Merge the options with the global options

## Options

Top-level options

| Option            | Type    | Default   | Description                                                                                                              |
| ----------------- | ------- | --------- | ------------------------------------------------------------------------------------------------------------------------ |
| `options.log`     | object  | `console` | By default set to a `console` wrapper. Setting log to `null` will turn off logging.                                      |
| `options.worker`  | boolean | `true`    | If the selected loader is equipped with a worker url (and the runtime environment supports it) parse on a worker thread. |
| `options.cdn`     | boolean | string    | `true`                                                                                                                   | `true` loads from `unpkg.com/@loaders.gl`. `false` load from local urls. `string` alternate CDN url. |
| `options.modules` | Object  | -         | Supply bundles modules or override local urls.                                                                           |
