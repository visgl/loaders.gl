# @loaders.gl/images/image

Use this entry point to decode and encode common image formats. Pass `ImageLoader` to
`load()`, or use `ImageLoaderWithParser` when your application needs the parser upfront.
Use `ImageWriter` to encode an image.

```ts
import {load} from '@loaders.gl/core';
import {ImageLoader} from '@loaders.gl/images/image';

const image = await load(url, ImageLoader);
```

In browsers, [GIFBuilder](./api-reference/gif-builder.md) assembles images or captured
frames into an animated GIF.
