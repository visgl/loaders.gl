Tile converter / distribution

# Ship the converter as one runnable script.

The bundle script packages the tile converter for users who need a simple Node.js entry point rather than a repository checkout or npm installation. The generated script still uses the same conversion options and output policies.

[Tile converter module](https://loaders.gl/next/docs/modules/tile-converter.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tile-converter.md)[CLI reference](https://loaders.gl/next/docs/modules/tile-converter/cli-reference/tile-converter.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tile-converter/cli-reference/tile-converter.md)[Build instructions](https://loaders.gl/next/docs/modules/tile-converter/api-reference/build-instructions.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tile-converter/api-reference/build-instructions.md)

Portable distribution

## Build once, run where Node.js is available.

A bundle is useful for a controlled handoff or an offline conversion environment. Keep the generated script, install the required elevation model, and add an external archiver only when SLPK output is needed.

01

Build

Generate converter.min.js from the tile-converter module.

02

Run

Use the script with Node.js and the normal CLI options.

03

Prepare

Install or configure the Earth Gravity Model as needed.

04

Package

Provide an external archiver when the output needs SLPK packaging.

Detailed guide

## Bundle script details

The detailed guide covers bundle generation, runtime requirements, elevation-model setup, archiver requirements, and example conversions.

![From-v3.0](https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square)

The converter can be run with autonomous script. It might be helpful for users which are not experienced in npm/yarn tools. All what they have to have to run conversion is a built script (converter.min.js) and NodeJS. If making \*.slpk is necessary, a zip archiver is "must have" as well. The "bundle script" is good options for fast and easy destribution of the converter.

1. Create bundle:

```
cd modules/tile-converter

yarn build-converter-bundle
```

This command generates bundle into "modules/cli/dist/converter.min.js"

2. Take "converter.min.js". It can be run on Ubuntu and Windows as autonomous script;

3. Install default Earth Gravity Model (egm2008-5):

```
node converter.min.js --install-dependencies
```

You can use custom Earth Gravity Model using `--egm` option.

4. Check out cli options: `node converter.min.js --help`

5. Example:

```
node converter.min.js --input-type 3dtiles --tileset ../Frankfurt-3d-tiles/cesiumJpg/tileset.json --name Frankfurt_completed_bundle --output data --max-depth 6 --slpk
```

6. Requirements:

* [NodeJs](https://nodejs.org/);

* External archiver (for slpk mode):

  <!-- -->

  * Ubuntu: `apt install zip`
  * Windows: [7-Zip](https://www.7-zip.org/). Default 7-zip location is "C:\Program Files\7-Zip\7z.exe" but there is option "--7zExe" that can be used for setup "7z.exe" location manualy.
