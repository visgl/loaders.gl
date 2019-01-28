# ImageLoader (Experimental)

An image loader that works under both Node.js and the browser.

* `image`
* `options.mimeType`

Remarks

* While generic, the `ImageLoader` is designed with WebGL applications in mind, ensuring that loaded image data can be used to create a `WebGLTexture` both in the browser and in headless gl under Node.js
