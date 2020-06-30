/* global console, process */
/* eslint-disable no-console */
const { Converter3dTilesToI3S } = require('@loaders.gl/cli');
import "@loaders.gl/polyfills";


const MAX_LENGTH = 76;

function printHelp() {
  console.log('cli: converter 3dTiles to I3S...');
  console.log('--tileset [tileset.json file]');
  console.log('--name [Tileset name, default: "default"]');
  console.log('--output [Output folder]');
  process.exit(0); // eslint-disable-line
}

let options;

function main() {
  const [, , ...args] = process.argv;

  if (args.length === 0) {
    printHelp();
  }

  options = parseOptions(args);

  converter(options.tileset, options.name, options.output);
}

main();

function converter(tileset, tilesetName, output) {
  console.log("Start load 3dTiles");

  const converter = new Converter3dTilesToI3S();
  const tilesetJson = converter.convert(tileset, output, tilesetName);

  console.log("Stop load 3dTiles");
  console.log(tilesetJson);
}

// OPTIONS

function parseOptions(args) {
  const opts = {
    tileset: null,
    name: "default",
    output: null
  };

  const count = args.length;
  const _getValue = (index) => {
    if (index >= count) {
      return null;
    }
    const value = args[index];
    if (value.indexOf('--') === 0) {
      return null;
    }
    return value;
  };

  args.forEach((arg, index) => {
    if (arg.indexOf('--') === 0) {
      switch (arg) {
        case '--tileset':
          opts.tileset = _getValue(index + 1);
          break;
        case '--name':
          opts.name = _getValue(index + 1);;
          break;
        case '--output':
          opts.output = _getValue(index + 1);
          break;
        case '--help':
          printHelp();
          break;
        default:
          console.warn(`Unknown option ${arg}`);
          process.exit(0); // eslint-disable-line
      }
    }
  });
  return opts;
}
