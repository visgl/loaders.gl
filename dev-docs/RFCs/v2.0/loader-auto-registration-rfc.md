# RFC: Loader Auto-Registration

- **Authors**: Ib Green
- **Date**: Jun 2019
- **Status**: For Review

## Abstract

This RFC proposes that importing loaders.gl loader modules autoregisters their loaders, removing the need to also import and call `registerLoaders`.

## Review Notes
- Sep 2019 - the `CompositeLoader` system is somewhat reducing the need to pre-register loaders.


## Motivation

Starting with deck.gl v7.2, URL strings passed to "async layer props" are now resolved using the loaders.gl `load` function, and thus any pre-registered loaders will be available to parse the data, making it easy for apps to add support for new file formats.

deck.gl only pre-registers some loaders like "images", so apps still have to decide which loader modules to import. Because of this, apps could be made slightly more elegant if loader modules auto-registered their loaders during import.

## Proposals

Simply importing a loader module would make that loader available to the async props of deck.gl layers:

BEFORE

```js
import {registerLoaders} from '@loaders.gl/core';
import {LASLoader} from '@loaders.gl/las';
registerLoaders(LASLoader);

new PointCloudLayer({data: LAZ_SAMPLE_URL});
```

AFTER

```js
import '@loaders.gl/las'; // Simply importing it makes this loader available

new PointCloudLayer({data: LAZ_SAMPLE_URL});
```

Also, with the right loader lookup mechanism in place (see separate RFC), the need to pass around optional sub-loaders (e.g. Draco) could be removed from the loaders.gl API:

BEFORE

```js
import {registerLoaders} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/gltf';
import {DracoLoader} from '@loaders.gl/draco';

new ScenegraphLayer({
  scenegraph: DRACO_COMPRESSED_GLTF_URL,
  loaderOptions: {DracoLoader} // Note: explicitly passing in a sub-loader through options
});
```

AFTER

```js
import '@loaders.gl/gltf';
import '@loaders.gl/draco'; // Simply importing it makes this loader available

new ScenegraphLayer({scenegraph: DRACO_COMPRESSED_GLTF_URL});
```


## Open Issues

While loader "pre-registration" would be trivial to implement, there are some concerns:

- Tree-shaking: A loader module often exports multiple loaders. By auto registering all of them, we  defeat tree-shaking (mitigated by the fact that we are already publishing loaders a-la-carte).
- Which loader(s) to register: The default main-thread loader, the streaming loader, or the worker thread loader? All of them? Create separate entry-points for each of them?

```js
import '@loaders.gl/draco'; // Registers minimal loaders, perhaps using CDN?
import '@loaders.gl/draco/mainthread-loader'; // Registers bundled main thread loader
import '@loaders.gl/draco/worker-loader'; // Registers bundled worker loader available
```

This would require solving non-trivial problems in ocular-dev-tools (which would of course be helpful in other cases), relating e.g. to src/dist aliasing and pre-compilation.

- Increased dependency: Currently simple loader modules can be written without importing any loaders.gl helper libraries (e.g. `@loaders.gl/loader-utils`). If the loader modules have to import `registerLoaders` that changes. This is a design simplicity/elegance in loaders.gl that matters to some people, that would be lost for this convenience.
- Manual registration code? - To avoid having to import `@loaders.gl/loader-utils` in each loader module, we could just ask each loader to push their loaders to a global array. But even then, the global scope must be determined, if not by helper functions in loaders.gl, then by some code that needs to be copied into each loader.
- Conceptually, global mechanisms should normally be minimized.

