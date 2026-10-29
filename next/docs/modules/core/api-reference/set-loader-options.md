Core API / configuration

# Set shared options once, keep individual calls focused.

setLoaderOptions() merges application-wide defaults for core and loader modules. Use it for stable runtime configuration such as decoder modules, then override individual operations when a request needs different behavior.

[Core module](https://loaders.gl/next/docs/modules/core.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core.md)[LoaderOptions](https://loaders.gl/next/docs/modules/core/api-reference/loader-options.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/api-reference/loader-options.md)[Worker loaders](https://loaders.gl/next/docs/developer-guide/using-worker-loaders.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-worker-loaders.md)

Configuration scope

## Configure the runtime at the edge.

Global options are useful for module registration and shared defaults, but the effective options still come from the merge of global, loader, and operation-level settings.

01

Register

Provide decoder modules or shared runtime dependencies.

02

Default

Set module-specific options used by later operations.

03

Override

Pass operation options when one request needs a different policy.

04

Inspect

Read the current merged global options with getLoaderOptions().

Detailed guide

## Loader options reference

The detailed reference covers set/get behavior, merge semantics, module namespaces, and the relationship to parse and loader options.

Set or get the supplied options onto the current global options object

## Usage[​](#usage "Direct link to Usage")

Bundling the entire `draco3d` library (instead of loading it on-demand from CDN):

```
import draco3d from 'draco3d';

import {setLoaderOptions} from '@loaders.gl/core';

setLoaderOptions({

  modules: {

    draco3d

  }

});
```

## Functions[​](#functions "Direct link to Functions")

### setLoaderOptions(options: LoaderOptions) : void[​](#setloaderoptionsoptions-loaderoptions--void "Direct link to setLoaderOptions(options: LoaderOptions) : void")

Merges the supplied options into the current global options

* `options`: See [`LoaderOptions`](https://loaders.gl/next/docs/modules/core/api-reference/loader-options.md).

### getLoaderOptions() : LoaderOptions[​](#getloaderoptions--loaderoptions "Direct link to getLoaderOptions() : LoaderOptions")

Returns current global options

## Options[​](#options "Direct link to Options")

The options object can contain:

* options defined by the `parse` function can be specified.
* options specific to any loaders can also be specified (in loader specific sub-objects).

Please refer to the corresponding documentation page for `parse` and to each loader for details.
