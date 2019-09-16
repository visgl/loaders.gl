# GLTFWriter

The `GLTFWriter` is a writer for glTF scenegraphs.

| Loader                | Characteristic                                                             |
| --------------------- | -------------------------------------------------------------------------- |
| File Extensions       | `.glb`,`.gltf`                                                             |
| File Types            | Binary, JSON, Linked Assets                                                |
| Data Format           | [Scenegraph](/docs/specifications/category-scenegraph)                     |
| File Format           | [glTF](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0) |
| Encoder Type          | Synchronous (limited), Asynchronous                                        |
| Worker Thread Support | No                                                                         |
| Streaming Support     | No                                                                         |

## Usage

```js
import {GLTFWriter} from '@loaders.gl/gltf';
import {encodeSync} from '@loaders.gl/core';

const arrayBuffer = encodeSync(gltf, GLTFWriter, options);
```

## Options

| Option        | Type                                                  | Default | Description                                                                                   |
| ------------- | ----------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `DracoWriter` | [DracoWriter](/docs/api-reference/draco/draco-writer) | `null`  | To enable DRACO encoding, the application needs to import and supply the `DracoWriter` class. |
| `DracoLoader` | [DracoLoader](/docs/api-reference/draco/draco-loader) | `null`  | To enable DRACO encoding, the application needs to import and supply the `DracoLoader` class. |
