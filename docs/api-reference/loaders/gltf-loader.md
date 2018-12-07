# GLTFLoader

Parses a glTF file into a hirearchical scenegraph description that can be used to instantiate an actual Scenegraph in most WebGL libraries.



## Usage

```
import {GLTFLoader, loadFile} from 'loaders.gl';

loadFile(url, GLTFLoader).then(data => {
  // Application code here
  ...
});
```
