# RFC: Loader Auto-Registration

- **Authors**: Ib Green
- **Date**: Jun 2019
- **Status**: For Review

## Summary

loaders.gl loader modules autoregister their loaders

This is a proposal for loaders.gl, but mentioned here for completeness:

## Overview

With deck.gl v7.2 being updated to use default registered loaders, many apps could be made slightly more elegant if loaders.gl loader modules auto-registered their loaders during import.

Simply importing a loader module would make that loader available to the async props of deck.gl layers:

BEFORE

```js
import {registerLoaders} from '@loaders.gl/core';
import {LAZLoader} from '@loaders.gl/las';
registerLoaders(LAZLoader);

new PointCloudLayer({
  data: LAZ_SAMPLE
});
```

AFTER

```js
import '@loaders.gl/las';

new PointCloudLayer({
  data: LAZ_SAMPLE
});
```

Also, with the right loader lookup mechanism in place (see separate RFC), the need to pass in optional support loaders could be removed from the loaders.gl API:

BEFORE

```js
import {registerLoaders} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/gltf';
import {DracoLoader} from '@loaders.gl/draco';

new ScenegraphLayer({
  scenegraph: DRACO_COMPRESSED_GLTF_URL,
  loaderOptions: {DracoLoader} // NOTE: Exact deck.gl API still TBD
});
```

AFTER

```js
import '@loaders.gl/gltf';
import '@loaders.gl/draco'; // Simply importing makes this loader available

new ScenegraphLayer({
  scenegraph: DRACO_COMPRESSED_GLTF_URL
});
```

## Open Issues

While such "pre-registration" would be trivial to implement, there are some concerns:

- Which loader(s) to register: The default main-thread loader, the streaming loader, or the worker thread loader? All of them?
- Tree-shaking: A loader module often exports multiple loaders. By auto registering all of them, we might defeat tree-shaking (a modest concern, since we are already publishing loaders a-la-carte).
- Increased dependency: Currently simple loader modules can be written without importing any loaders.gl helper libraries (`@loaders.gl/loader-utils`). If the loader modules have to import `registerLoaders` that changes. This is a design simplicity/elegance in loaders.gl that matters to some people, that would be lost for this convenience.
- Manual registration code? - To avoid having to import `@loaders.gl/loader-utils` in each loader module, we could just ask each loader to push their loader a global array. But even then, the global scope must be determined, normally by helper function in loaders.gl.
