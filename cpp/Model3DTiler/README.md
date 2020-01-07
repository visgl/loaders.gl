# Model3DTiler

Build cesium 3D tiles from las, laz.

## Downloads

* [Source Code](https://github.com/uber-web/loaders.gl/tree/master/cpp/Model3DTiler)

## Dependencies

* [lastools(LASzip)](https://github.com/LAStools/LAStools) or [fork of lastools with cmake for LASzip](https://github.com/m-schuetz/LAStools)

## Build

### linux / gcc 4.9


lastools (from fork with cmake)

```
cd ~/dev/workspaces/lastools
git clone https://github.com/m-schuetz/LAStools.git master
cd master/LASzip
mkdir build
cd build
cmake -DCMAKE_BUILD_TYPE=Release ..
make

```

Model3DTiler

```
cd ~/dev/workspaces/loaders.gl
git clone https://github.com/uber-web/loaders.gl.git master
cd master/cpp/Model3DTiler
mkdir build
cd build
cmake -DCMAKE_BUILD_TYPE=Release -DLASZIP_INCLUDE_DIRS=~/dev/workspaces/lastools/master/LASzip/dll -DLASZIP_LIBRARY=~/dev/workspaces/lastools/master/LASzip/build/src/liblaszip.so ..
make

```

### OS X

Same as the linux instructions above, except:

1. Install Xcode version >= 11.1
2. Give cmake absolute paths to the LASzip tools you just built. (Otherwise make might not be able to find them)
3. LASZip library will be called `liblaszip.dylib`, not `liblaszip.so`

Command line build

```
...
cmake -DCMAKE_BUILD_TYPE=Release -DLASZIP_INCLUDE_DIRS=[ABSOLUTE_PATH_TO_LASTOOLS]/LAStools/LASzip/dll -DLASZIP_LIBRARY=[ABSOLUTE_PATH_TO_LASTOOLS]/LAStools/LASzip/src/build/liblaszip.dylib ..

make

```

Create Xcode project

```
...
cmake -DLASZIP_INCLUDE_DIRS=[ABSOLUTE_PATH_TO_LASTOOLS]/LAStools/LASzip/dll -DLASZIP_LIBRARY=[ABSOLUTE_PATH_TO_LASTOOLS]/LAStools/LASzip/src/build/liblaszip.dylib -G Xcode ..

```

## Model3DTiler Usage

Converts las/laz file to the cesium 3D tile format.

Examples:

    # convert data.las with geo anchor position (37.789874, -122.400326, -8)
    ./Model3DTiler ~/Documents/data.las -o ~/test --output-format PNTS -latitude 37.789874 -longitude -122.400326 -altitude -8.0

    # convert data.las with draco compression in 8 quantization bits
    ./Model3DTiler ~/Documents/data.las -o ~/test --output-format PNTS --draco --position-bits 8 --latitude 37.789874 --longitude -122.400326 --altitude -8.0
