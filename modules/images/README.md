# @loaders.gl/images

Image loaders and writers using browser and Node.js image codecs.

Supported formats: PNG, JPEG, JPG, GIF, WebP, BMP, ICO, SVG, AVIF. Availability depends on the runtime and installed codecs.

For documentation please visit the [website](https://loaders.gl).

## Sources and credits

See [THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md) for implementation lineage
and applicable notices, and the project-wide [References and credits](https://loaders.gl/docs/references-and-credits).

Texture and video metadata loaders are exported from the same lightweight root.
Direct parsers use `*WithParser` exports from flat subpaths such as
`@loaders.gl/images/basis-loader` and `@loaders.gl/images/video-loader`.
Texture writers, manifest schemas, and GIFBuilder also use direct subpaths.
Node image codecs require the optional `sharp` peer of `@loaders.gl/core`;
other polyfills and browser images do not load it.
