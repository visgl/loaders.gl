# GLBLoader (@loaders.gl/gltf)

Provides functions for parsing the binary GLB containers used by glTF (and certain other formats).

Loads a binary GLB chunk and decodes it into a JavaScript data structure and a blob with binary data.


## Usage

```
import {GLBLoader} from 'loaders.gl/gltf';
import {loadFile} from 'loaders.gl/core';

loadFile(url, GLBLoader).then(data => {
  // Application code here
  ...
});
```

## Structure of Loaded Data

Loads a JSON object with embedded binary data.
