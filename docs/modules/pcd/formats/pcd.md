# PCD - Point Cloud Data

- *[`@loaders.gl/pcd`](/docs/modules/pcd)*
- *[PCD documentation](https://pcl.readthedocs.io/projects/tutorials/en/latest/pcd_file_format.html)*
- *[Wikipedia article](https://en.wikipedia.org/wiki/Point_Cloud_Library)*

PCD (Point Cloud Data) is a data format for storing 3D point clouds with some notable characteristics:

- Binary storage for fast saving and loading of points (memory mapping possible on some systems).
- Supports compressed binary storage for compact file sizes.
- Supports ASCII storage for easy inspection and editing. 
- Ability to store and process organized point cloud datasets. 
- ASCII header is always human readable, can easily can be inspected and even edited in standard software tools.
- Supports numeric columns only, no text columns or metadata


## Columns

PCD files can contain arbitrarily named columns, however some columns have pre-defined semantics:

| Column name | Format    | Description                     |
| ----------- | --------- | ------------------------------- |
| `x`         | `float32` | Spatial coordinate, x dimension |
| `y`         | `float32` | Spatial coordinate, y dimension |
| `z`         | `float32` | Spatial coordinate, z dimension |
| `normal_x`  | `float32` | Normal vector, x component      |
| `normal_y`  | `float32` | Normal vector, y component      |
| `normal_z`  | `float32` | Normal vector, z component      |
| `color_r`   | `uint8`   | Color, red component            |
| `color_g`   | `uint8`   | Color, green component          |
| `color_b`   | `uint8`   | Color, blue component           |
| `color_a`   | `uint8`   | Color, alpha component          |
| `rgb`       |           | Color without alpha component   |
| `rgba`      |           | Color with alpha component      |
| `intensity` |           |                                 |


PCD supports color with a 4-byte `rgb` or `rgba` component; this contains the same information as the group of `color_r`, `color_g`, `color_b`, and `color_a` components.

##  Detailed File Structure

The PCD file is divided into two parts - header and data. 

The header contains the necessary information about the point cloud data that are stored in the file. The header is encoded in ASCI and has a precisely defined format with one named field per line. Note that order of header entries is important!
 
In version 0.7 the version of the PCD file is at the beginning of the header, followed by the name, size, and type of each dimension of the stored data. 

The header contains data such as
| Header field      | Description                                                                                                                         |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `VERSION`         | PCD version, should be `.7`                                                                                                         |
| `FIELDS`          | name of each dimension of the stored data                                                                                           |
| `SIZE`            | size of each dimension of the stored data                                                                                           |
| `TYPE`            | type of each dimension of the stored data                                                                                           |
| `WIDTH`, `HEiGHT` | A number of points (height*width) in the whole cloud information about whether the point cloud dataset is organized or unorganized. |
| `DATA`            | The data type specifies in which format the point cloud data are stored (ASCII or binary).                                          |

While the PCD header is always encoded in ASCII, the point data that follows it can be stored in three different formats: 
- ASCII
- Binary
- Compressed binary

Each point can be stored on a separate line (unorganized point-cloud) or they are stored in an image-like organized structure (organized point-cloud).

## Versions

The PCD version is specified with the numbers 0.x (e.g., 0.5, 0.6, etc.) in the header of each file. 

PCD was originally released in 2011. PCD was created because existing formats (such as PLY, IFS, VTK, STL, OBJ, X3D) lacked the features, flexibility and speed Required by the [PCL](https://pointclouds.org/documentation/) (Point Cloud Library) project. 

### PCD 0.7 (PCD_V7)

The official version in 2020.  
  
- New header field: `VIEWPOINT` that specifies the orientation of the sensor relative to the dataset.

## Example file

```
# .PCD v.7 - Point Cloud Data file format
VERSION .7
FIELDS x y z rgb
SIZE 4 4 4 4
TYPE F F F F
COUNT 1 1 1 1
WIDTH 213
HEIGHT 1
VIEWPOINT 0 0 0 1 0 0 0
POINTS 213
DATA ascii
0.93773 0.33763 0 4.2108e+06
0.90805 0.35641 0 4.2108e+06
0.81915 0.32 0 4.2108e+06
0.97192 0.278 0 4.2108e+06
0.944 0.29474 0 4.2108e+06
0.98111 0.24247 0 4.2108e+06
```
