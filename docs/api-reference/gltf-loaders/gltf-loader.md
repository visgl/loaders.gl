# GLTFLoader (@loaders.gl/gltf)

Parses a glTF file into a hirearchical scenegraph description that can be used to instantiate an actual Scenegraph in most WebGL libraries.



## Usage

```
import {GLTFLoader} from '@loaders.gl/gltf';
import {loadFile} from '@loaders.gl/core';

loadFile(url, GLTFLoader).then(data => {
  // Application code here
  ...
});
```
