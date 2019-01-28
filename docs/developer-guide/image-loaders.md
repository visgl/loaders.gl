# Image Loaders

The image loader focuses on JPEG and PNG formats.


## HTMLImageLoader

> This loader only works in the browser main thread

This loader returns HTMLImage (Image) objects.


## ImageBitmapLoader

> This loader works in "evergreen" browsers' main thread and worker threads, but not in older browsers such as IE11. (confirm)

Loads an `ImageBitmap` object containing data for the object.


## ImageLoader (PlatformImageLoader)

> This image loader works on all platforms

Loads a platform-specific image object of unspecified type. The returned object is however guaranteed to be usable as input data to WebGL textures under all platforms including headless gl on Node.js.


## Platform Independent Image Utilities

TBA - a set of functions to access image data regardless of the loaded image type, e.g `getImageData` => TypedArray
// TODO - export functions that work on "platform images",
// e.g. extracts image data as typed array from any of the platform image formats.


## Remarks

Loading of images across the browser's main thread, worker threads and Node.js with any semblance of portability takes a fair of effort. Some of the main complications are:

* Modern browsers have built-in decoders for JPEG/PNG/GIF formats that are highly hardware accelerated, so it is critical that loaders leverage those. Those decoders are accessible through a couple of different APIs, all of which have some particularities (like combine reading and parsing etc) that need to be accounted for.
* Node.js doesn't have an official image parsing API but various mpm modules exist that offer parsing. As the name suggests, loaders.gl focuses on loading resources that can be used in WebGL, so we want to load images into a format that can be passed to node.js implementations of WebGL such as headless-gl.