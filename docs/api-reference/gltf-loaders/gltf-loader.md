# GLTFLoader (@loaders.gl/gltf)

Parses a glTF file into a hirearchical scenegraph description that can be used to instantiate an actual Scenegraph in most WebGL libraries.

Can load a binary GLB chunk and decodes it into a JavaScript data structure and a blob with binary data.


## Usage

```
import {GLTFLoader} from '@loaders.gl/gltf';
import {loadFile} from '@loaders.gl/core';

loadFile(url, GLTFLoader).then(data => {
  // Application code here
  ...
});
```


## Structure of Loaded Data

Returns a JSON object with "embedded" binary data in the form of typed javascript arrays.
