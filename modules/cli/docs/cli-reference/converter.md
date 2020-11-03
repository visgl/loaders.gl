## converter

`converter` is a command line utility for converting 3d-tiles to i3s and backward - i3s to 3d-tiles.

Installing `@loaders.gl/cli` makes the `converter` command line tool available. It can be run using `npx`.

```bash
$ npx converter --input-type <I3S | 3DTILES> --tileset <tileset> --name <tileset name> [--output <output folder>][--draco] [--max-depth 4] [--slpk] [--7zExe <path/to/7z.exe>][--token <ION token>]
```

```bash
$ npx converter --help
```

### Options

| Option     | 3DTiles to I3S conversion | I3S to 3DTiles conversion | Description                                                                                                                            |
| ---------- | ------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| input-type | \*                        | \*                        | "I3S" - for I3S to 3DTiles conversion, "3DTILES" for 3DTiles to I3S conversion                                                         |
| tileset    | \*                        | \*                        | "tileset.json" file (3DTiles) / "http://..../SceneServer/layers/0" resource (I3S)                                                      |
| output     | \*                        | \*                        | Output folder. This folder will be created by converter if doesn't exist. It is relative to the converter path. Default: "data" folder |
| name       | \*                        | \*                        | Tileset name. This option is used for naming in resulting json resouces and for resulting path/\*.slpk file naming                     |
| max-depth  | \*                        | \*                        | Maximal depth of the hierarchical tiles tree traversal, default: infinite                                                              |
| slpk       | \*                        |                           | Whether the converter generate \*.slpk (Scene Layer Packages) I3S output file                                                          |
| 7zExe      | \*                        |                           | location of 7z.exe archiver to create slpk on Windows OS, default: "C:\\Program Files\\7-Zip\\7z.exe"                                  |
| token      | \*                        |                           | Token for Cesium ION tilesets authentication                                                                                           |
| draco      | \*                        |                           | Enable draco compression for geometry. Default: not set                                                                                |
| help       | \*                        | \*                        | Show the converter tool options list                                                                                                   |
