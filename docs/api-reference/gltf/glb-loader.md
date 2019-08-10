# GLBLoader

The `GLBLoader` parses a GLB binary "envelope".

Note: applications that want to parse GLB-formatted glTF files use the `GLTFLoader` instead. The `GLBLoader` is intended to be used to load custom data that combines JSON and binary resources.

| Loader                | Characteristic  |
| --------------------- | --------------- |
| File Extensions       | `.glb`          |
| File Types            | Binary          |
| Input Format          | [GLB](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#glb-file-format-specification) |
| Output Format         | [Scenegraph](/docs/specifications/category-scenegraph) |
| Decoder Type          | Synchronous     |
| Worker Thread Support | No              |
| Streaming Support     | No              |

## Usage

```js
import {load} from '@loaders.gl/core';
import {GLBLoader} from '@loaders.gl/gltf';
const gltf = await load(url, GLBLoader);
```


## Options

| Option        | Type      | Default     | Description       |
| ------------- | --------- | ----------- | ----------------- |
| `magic`       | Number    | glTF        | The magic number to be save in the file. |
