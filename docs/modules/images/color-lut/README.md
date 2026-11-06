# Color lookup tables

Use `CubeLUTLoader` or `ThreeDLLUTLoader` from `@loaders.gl/images` with core load/parse.
Parser-bearing exports live at `/cube-lut-loader` and `/3dl-lut-loader`.

Outputs contain a dimension (1 or 3), edge size, interleaved Float32 RGB samples,
and input domain bounds. Red input varies fastest, then green, then blue. Samples
are data: no gamma conversion, clamping, interpolation, or GPU objects are applied.

Cube supports a single 1D or 3D table, TITLE and DOMAIN_MIN/MAX. Combined shaper
and 3D files and vendor directives are rejected. 3dl supports grid-first files
with integer RGB rows (blue-fastest input order). Set `lut.outputBitDepth`
explicitly; output scaling is never inferred. Nonuniform input knots are retained.
Mesh-header/vendor 3dl variants are unsupported.

`parseImageLUT` from `@loaders.gl/images/color-lut` accepts decoded opaque RGB/RGBA
8-bit pixels and explicit `{size, tilesPerRow}`. Red increases horizontally, green
vertically, and blue slices advance across rows of tiles. Horizontal/vertical
strips and rectangular tilings are supported. Decode images without color-space
conversion or premultiplication before calling this utility. Encoded image loading
is deliberately left to the existing image APIs; this utility requires exact pixels.

For encoded PNGs, explicitly pass `ImageLUTLoader` and `{lut: {size, tilesPerRow}}`.
Its `/image-lut-loader` parser disables bitmap color-space conversion and
premultiplication, closes temporary bitmaps, and rejects nonopaque samples. It
uses the existing image APIs and requires their browser/Node bitmap facilities.
PNG identification alone does not imply that an image is a LUT; select this loader
explicitly. The initial image loader supports 8-bit samples only.
