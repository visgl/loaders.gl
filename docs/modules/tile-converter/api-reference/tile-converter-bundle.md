## Tile converter bundle script

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

The converter can be run with autonomous script. It might be helpful for users which are not experienced in npm/yarn tools. All what they have to have to run conversion is a built script (converter.min.js) and NodeJS. If making \*.slpk is necessary, a zip archiver is "must have" as well.
The "bundle script" is good options for fast and easy destribution of the converter.

1. Create bundle:

```yarn boostrap
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

- [NodeJs](https://nodejs.org/);
- External archiver (for slpk mode):
  - Ubuntu: `apt install zip`
  - Windows: [7-Zip](https://www.7-zip.org/). Default 7-zip location is "C:\Program Files\7-Zip\7z.exe" but there is option "--7zExe" that can be used for setup "7z.exe" location manualy.
