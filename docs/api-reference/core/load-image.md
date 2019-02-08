# loadImage

## Functions

### loadImage(url : String [, options : Object]) : Image / HTMLImageElement

<p class="badges">
   <img src="https://img.shields.io/badge/browser-only-red.svg?style=flat-square" alt="browser only" />
</p>

This is a minimal basic image loading function that only works in the browser main threaqd. For image loading and writing that works across both browser and node, refer to the `@loaders.gl/images` module.

`options.crossOrigin` - Provides control of the requests cross origin field.

Notes:
* Any path prefix set by `setPathPrefix` will be appended to relative urls.
