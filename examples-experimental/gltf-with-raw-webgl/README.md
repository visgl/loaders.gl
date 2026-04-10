# gltf-with-raw-webgl

This sample can serve as a starting point for someone wanting to write a GLTF loader that loads the file to a raw WebGL application. It uses loaders.gl to parse the file and displays it to a raw WebGL canvas.

It can also be useful to someone who wants to learn more about the GLTF format.

To run the example you'll just need to download a .glb file and then run an HTTP server. All the steps are described below.

This sample is not production ready and only partially loads the GLB file. It only loads the meshes and their pbrMetallicRoughness.baseColorTexture. This is enough to load photogrammetries but it doesn't load reflective textures, animations, transformations, scene graph, etc...


### 1°) Download sample GLB file:

```
cd gltf-raw-webgl/glb-files
curl -L -o DamagedHelmet.glb https://github.com/KhronosGroup/glTF-Sample-Models/raw/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb
```


### 2°) Run an HTTP server:

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
