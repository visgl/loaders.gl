# Using Loaders

loaders.gl has parser functions that use so called "loaders" to convert the raw data loaded from files into parsed objects. Each loader encapsulates a parsing function for one file format (or a group of related file formats) together with some metadata (like the loader name, common file extensions for the format etc).

## Installing loaders

loaders.gl provides a suite of pre-built loader objects packaged as scoped npm modules. The intention is that applications will install and import loaders only for the formats they need.

## Using Loaders

Loaders are passed into utility functions in the loaders.gl core API to enable parsing of the chosen format.

```js
import {load} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';

data = await load(url, CSVLoader);
// Application code here
...
```

## Specifying and Registering Loaders

As seen above can be specified directly in a call to `load` or any of the `parse` functions:

```js
import {load} from '@loaders.gl/core';
import {PCDLoader} from '@loaders.gl/pcd';
import {LASLoader} from '@loaders.gl/las';

const pointCloud = await load(url, [PCDLoader, LASLoader]);

// Application code here
...
```

Loaders can also be registered globally. To register a loader, use `registerLoaders`:

```js
import {registerLoaders, load} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';

registerLoaders([CSVLoader]);

data = await load('url.csv'); // => CSVLoader selected from pre-registered loaders
```

## Selecting Loadera

The loader selection algorithm is exposed to applications via `selectLoader`:

```js
import {selectLoader} from '@loaders.gl/core';
import {ArrowLoader} from '@loaders.gl/arrow';
import {CSVLoader} from '@loaders.gl/csv';

selectLoader([ArrowLoader, CSVLoader], 'filename.csv'); // => CSVLoader
```

Note: Selection works on urls and/or data

## Loader Options

`load`, `parse` and other core functions accept loader options in the form of an options object.

```js
parse(data, Loader, {...options});
```

Such loader options objects are organized into nested sub objects, with one sub-object per loader or loader category. This provides a structured way to pass options to multiple loaders.

```js
load(url, {
  json: {...},
  csv: {...},
  '3d-tiles': {...},
  gltf: {...}
});
```

An advantage of this design is that since the core functions can select a loader from a list of multiple candidate loaders, or invoke sub-loaders, the nested options system allows separate specification of options to each loader in a single options object.

Loader options are merged with default options using a deep, two-level merge. Any object-valued key on the top level will be merged with the corresponding key value in the default options object.

## Using Composite Loaders

loaders.gl enables the creation of _composite loaders_ that call other loaders (referred to as "sub-loaders" in this section). This enables loaders for "composite formats" to be quickly composed out of loaders for the primitive parts.

Composite Loader usage is designed to be conceptually simple for applications (loaders.gl handles a number of subtleties under the hood).

A composite loader is called just like any other loader, however there are some additional

### Parameter Passing between Loaders

Loaders and parameters are passed through to sub loaders and are merged so that applications can override them:

```js
  parse(data, [Tiles3DLoader, GLTFLoader, DracoLoader], {
    '3d-tiles': {
      ...
    },
    gltf: {
      ...
    }
  });
```

In this example:

- the passed in loaders would override any loaders specified inside the sub-loaders as well as any globally registered loaders.
- The options will be passed through to the sub-loaders, so that the `GLTFLoader` will receive the `gltf` options, merged with any `gltf` options set by the `Tiles3DLoader`.

This override system makes it easy for applications to test alternate sub-loaders or parameter options without having to modify any existing loader code.
