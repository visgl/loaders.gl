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

## Using Worker Loaders

Some loader modules provide _worker loaders_, e.g. the `DracoWorkerLoader`. These loaders execute on a worker thread, meaning that the main thread will not block during parsing. There can also be multiple parallel workers, potentially increasing parsing throughput on multicore CPUs.

To use worker loaders, jut the worker loader

Concurrency - The `maxConcurrency` parameter can be adjusted to define how many workers should be created for each format.

Note that when calling worker loaders, binary data is transferred from the calling thread to the worker thread. This means that any `ArrayBuffer` `data` parameter you pass in to the worker will no longer be accessible in the calling thread.
