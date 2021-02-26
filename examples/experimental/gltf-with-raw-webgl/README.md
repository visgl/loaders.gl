# gltf-with-raw-webgl

This sample can serve as a starting point for someone wanting to write a GLTF loader that loads the file to a raw WebGL application. It uses loaders.gl to parse the file and displays it to a raw WebGL canvas.

It can also be usefull to someone who wants to learn more about the GLTF format.

To run the example you'll just need to pack loaders.gl, download a .glb file and then run an HTTP server. All the steps are described below.

This sample is not production ready and only partially loads the GLB file. It only loads the meshes and their pbrMetallicRoughness.baseColorTexture. This is enough to load photogrammetries but it doesn't load reflective textures, animations, transformations, scene graph, etc...


### 1°) Pack loaders.gl as a standalone lib:

First download loaders.gl and some dependencies:

```
cd gltf-raw-webgl/lib/loaders.gl.webpack
npm install
```

Then pack loaders.gl:

```
npx webpack --config webpack.config.js
```

This generates the `gltf-raw-webgl/lib/loaders.gl.webpack/lib/loaders.gl.js` file that contains loaders.gl and that can be imported in any HTML file and used in a raw JavaScript project (no need for Node.js).

### 2°) Download sample GLB file:

```
cd gltf-raw-webgl/glb-files
curl -L -o DamagedHelmet.glb https://github.com/KhronosGroup/glTF-Sample-Models/raw/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb
```

### 3°) Run an HTTP server:

If needed, install an HTTP server, for instance:

```
npm install --global http-server
```

Then run it:

```
cd gltf-raw-webgl
http-server
```

And go to http://localhost:8080

You should see the DamagedHelmet.glb model rotating:

![DamagedHelmet.glb](screenshot.png)
