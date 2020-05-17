# Image Utilities

A small set of image utility functions functions intended to help write image handling code that works across platforms.

Background: The image returned by the [`ImageLoader`](modules/images/docs/api-reference/image-loader.md) depends on the environment, i.e. whether the application is running in a new or old browser, or under Node.js.

## Usage

Determine supported image types in a platform independent way:

```js
import {getDefaultImageType, isImageTypeSupported} from `@loaders.gl/images`;
```

## Functions

### getDefaultImageType(): string

Returns `true` if `type` is one of the types that `@loaders.gl/images` can use on the current platform (depends on browser, or whether running under Node.js).

### isImageTypeSupported(type : string) : boolean

- `type`: value to test

Returns `true` if `type` is one of the types that `@loaders.gl/images` can use on the current platform (depends on browser, or whether running under Node.js).
