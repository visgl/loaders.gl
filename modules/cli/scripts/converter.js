/* global console, process */
/* eslint-disable no-console */
const {I3SConverter} = require('@loaders.gl/cli');
import '@loaders.gl/polyfills';

const TILESET_TYPE = {
  I3S: 'I3S',
  _3DTILES: '3DTILES'
};

function printHelp() {
  console.log('cli: converter 3dTiles to I3S or I3S to 3dTiles...');
  console.log('--type [tileset type: I3S or 3DTILES]');
  console.log('--tileset [tileset.json file]');
  console.log('--name [Tileset name, default: "default"]');
  console.log('--output [Output folder]');
  console.log(
    '--max-depth [Maximal depth of hierarchical tiles tree traversal, default: infinite]'
  );
  process.exit(0); // eslint-disable-line
}

let options;

function main() {
  const [, , ...args] = process.argv;

  if (args.length === 0) {
    printHelp();
  }

  options = parseOptions(args);

  convert(options);
}

main();

// eslint-disable-next-line no-shadow
function convert(options) {
  const type = options.type.toUpperCase();
  console.log(`Start convert ${type}`); // eslint-disable-line
  let tilesetJson = '';
  switch (type) {
    case TILESET_TYPE.I3S:
      console.log('I3S - Not implement!'); // eslint-disable-line
      break;
    case TILESET_TYPE._3DTILES:
      // eslint-disable-next-line no-shadow
      const converter = new I3SConverter();
      tilesetJson = converter.convert(
        options.tileset,
        options.output,
        options.name,
        options.maxDepth
      );
      break;
    default:
      printHelp();
  }

  console.log(`Stop convert ${type}`); // eslint-disable-line
  console.log(tilesetJson); // eslint-disable-line
}

// OPTIONS

function parseOptions(args) {
  const opts = {
    type: null,
    tileset: null,
    name: 'default',
    output: null
  };

  const count = args.length;
  const _getValue = index => {
    if (index + 1 >= count) {
      return null;
    }
    const value = args[index + 1];
    if (value.indexOf('--') === 0) {
      return null;
    }
    return value;
  };

  args.forEach((arg, index) => {
    if (arg.indexOf('--') === 0) {
      switch (arg) {
        case '--type':
          opts.type = _getValue(index);
          break;
        case '--tileset':
          opts.tileset = _getValue(index);
          break;
        case '--name':
          opts.name = _getValue(index);
          break;
        case '--output':
          opts.output = _getValue(index);
          break;
        case '--max-depth':
          opts.maxDepth = _getValue(index);
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
