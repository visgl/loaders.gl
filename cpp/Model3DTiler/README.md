# Potree Converter

Master: [![Build Status](https://travis-ci.org/potree/PotreeConverter.svg?branch=master)](https://travis-ci.org/potree/PotreeConverter)
Develop: [![Build Status](https://travis-ci.org/potree/PotreeConverter.svg?branch=develop)](https://travis-ci.org/potree/PotreeConverter)

Builds a potree octree from las, laz, binary ply, xyz or ptx files.

## Downloads

* [Source Code and windows 64bit releases](https://github.com/potree/PotreeConverter/releases)

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

PotreeConverter

```
cd ~/dev/workspaces/PotreeConverter
git clone https://github.com/potree/PotreeConverter.git master
cd master
mkdir build
cd build
cmake -DCMAKE_BUILD_TYPE=Release -DLASZIP_INCLUDE_DIRS=~/dev/workspaces/lastools/master/LASzip/dll -DLASZIP_LIBRARY=~/dev/workspaces/lastools/master/LASzip/build/src/liblaszip.so ..
make

# copy ./PotreeConverter/resources/page_template to your binary working directory.

```

### OS X

Same as the linux instructions above, except:

1. Install Xcode version >= 11.1
2. Give cmake absolute paths to the LASzip tools you just built. (Otherwise make might not be able to find them)
3. LASZip library will be called `liblaszip.dylib`, not `liblaszip.so`

```
...
cmake -DCMAKE_BUILD_TYPE=Release -DLASZIP_INCLUDE_DIRS=[ABSOLUTE_PATH_TO_LASTOOLS]/LAStools/LASzip/dll -DLASZIP_LIBRARY=[ABSOLUTE_PATH_TO_LASTOOLS]/LAStools/LASzip/src/build/liblaszip.dylib ..

make

```

### Windows / Microsoft Visual Studio 2017:

lastools

```
cd D:/dev/workspaces/lastools/
git clone https://github.com/m-schuetz/LAStools.git master
cd master/LASzip
mkdir build
cd build
cmake -G "Visual Studio 15 2017 Win64" ../
```

PotreeConverter

```
# make sure you've got these environment variables set with your directory structure
set LASZIP_INCLUDE_DIRS=D:\dev\workspaces\lastools\master\LASzip\dll
set LASZIP_LIBRARY=D:\dev\workspaces\lastools\master\LASzip\build\src\Release\laszip.lib

# checkout PotreeConverter
cd D:/dev/workspaces/PotreeConverter
git clone https://github.com/potree/PotreeConverter.git master
cd master
mkdir build
cd build

# VS2017 64bit project
cmake -G "Visual Studio 15 2017 Win64" -DLASZIP_INCLUDE_DIRS=%LASZIP_INCLUDE_DIRS% -DLASZIP_LIBRARY=%LASZIP_LIBRARY%  ..\

# copy ./PotreeConverter/resources/page_template to your binary working directory.

```

## PotreeConverter Usage

Converts las files to the potree file format.
You can list multiple input files. If a directory is specified, all files
inside the directory will be converted.

Options:


```
$ PotreeConverter -h                                      
  -i [ --source ]                        input files
  -h [ --help ]                          prints usage
  -p [ --generate-page ]                 Generates a ready to use web page with the given name.
  -o [ --outdir ]                        output directory
  -s [ --spacing ]                       Distance between points at root level. Distance halves each level.
  -d [ --spacing-by-diagonal-fraction ]  Maximum number of points on the diagonal in the first level (sets spacing). spacing = diagonal value
  -l [ --levels ]                        Number of levels that will be generated. 0: only root, 1: root and its children, ...
  -f [ --input-format ]                  Input format. xyz: cartesian coordinates as floats, rgb: colors as numbers, i: intensity as number
  --color-range
  --intensity-range
  --output-format                        Output format can be BINARY, LAS or LAZ. Default is BINARY
  -a [ --output-attributes ]             can be any combination of RGB, INTENSITY and CLASSIFICATION. Default is RGB.
  --scale                                Scale of the X, Y, Z coordinate in LAS and LAZ files.
  --aabb                                 Bounding cube as "minX minY minZ maxX maxY maxZ". If not provided it is automatically computed
  --incremental                          Add new points to existing conversion
  --overwrite                            Replace existing conversion at target directory
  --source-listing-only                  Create a sources.json but no octree.
  --projection                           Specify projection in proj4 format.
  --list-of-files                        A text file containing a list of files to be converted.
  --source                               Source file. Can be LAS, LAZ, PTX or PLY
  --title                                Page title
  --description                          Description to be shown in the page.
  --edl-enabled                          Enable Eye-Dome-Lighting.
  --show-skybox
  --material                             RGB, ELEVATION, INTENSITY, INTENSITY_GRADIENT, RETURN_NUMBER, SOURCE, LEVEL_OF_DETAIL
```

Examples:

    # convert data.las and generate web page.
    ./PotreeConverter.exe C:/data.las -o C:/potree_converted -p pageName

    # generate compressed LAZ files instead of the default BIN format.
    ./PotreeConverter.exe C:/data.las -o C:/potree_converted --output-format LAZ

    # convert all files inside the data directory
    ./PotreeConverter.exe C:/data -o C:/potree_converted

    # first, convert with custom bounding box and then append new_data.las afterwards.
    # points in new_data MUST fit into bounding box!
    ./PotreeConverter.exe C:/data -o C:/potree_converted -aabb "-0.748 -2.780 2.547 3.899 1.867 7.195"
    ./PotreeConverter.exe C:/new_data.las -o C:/potree_converted --incremental

	# tell the converter that coordinates are in a UTM zone 10N projection. Also, create output in LAZ format
	./PotreeConverter.exe C:/data -o C:/potree_converted -p pageName --projection "+proj=utm +zone=10 +ellps=GRS80 +datum=NAD83 +units=m +no_defs" --overwrite --output-format LAZ

	# using a swiss projection. Use http://spatialreference.org/ to find projections in proj4 format
	./PotreeConverter.exe C:/data -o C:/potree_converted -p pageName --projection "+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=600000 +y_0=200000 +ellps=bessel +towgs84=674.4,15.1,405.3,0,0,0,0 +units=m +no_defs" --overwrite
