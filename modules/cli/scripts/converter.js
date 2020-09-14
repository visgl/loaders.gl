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
  console.log(
    '--max-depth [Maximal depth of hierarchical tiles tree traversal, default: infinite]'
  );
  console.log('--name [Tileset name]');
  console.log('--output [Output folder, default: "data" folder]');
  console.log('--slpk [Generate slpk (Scene Layer Packages) I3S output file]');
  console.log('--tileset [tileset.json file]');
  console.log('--input-type [tileset input type: I3S or 3DTILES]');
  process.exit(0); // eslint-disable-line
}

function validateOptions(options) {
  const mandatoryOptionsWithExceptions = {
    name: () => console.log('Missed: --name [Tileset name]'),
    tileset: () => console.log('Missed: --tileset [tileset.json file]'),
    inputType: () =>
      console.log('Missed/Incorrect: --input-type [tileset input type: I3S or 3DTILES]')
  };
  const exceptions = [];
  for (const mandatoryOption in mandatoryOptionsWithExceptions) {
    const optionValue = options[mandatoryOption];
    const isWrongInputType =
      Boolean(optionValue) &&
      mandatoryOption === 'inputType' &&
      !Object.values(TILESET_TYPE).includes(optionValue.toUpperCase());

    if (!optionValue || isWrongInputType) {
      exceptions.push(mandatoryOptionsWithExceptions[mandatoryOption]);
    }
  }
  if (exceptions.length) {
    exceptions.forEach(exeption => exeption());
    process.exit(0); // eslint-disable-line
  }
}

let options;

function main() {
  const [, , ...args] = process.argv;

  if (args.length === 0) {
    printHelp();
  }

  options = parseOptions(args);
  validateOptions(options);

  convert(options);
}

main();

// eslint-disable-next-line no-shadow
function convert(options) {
  const inputType = options.inputType.toUpperCase();
  console.log(`Start convert ${inputType}`); // eslint-disable-line
  let tilesetJson = '';
  switch (inputType) {
    case TILESET_TYPE.I3S:
      console.log('I3S - Not implement!'); // eslint-disable-line
      break;
    case TILESET_TYPE._3DTILES:
      // eslint-disable-next-line no-shadow
      const converter = new I3SConverter();
      tilesetJson = converter.convert({
        inputUrl: options.tileset,
        outputPath: options.output,
        tilesetName: options.name,
        maxDepth: options.maxDepth,
        slpk: options.slpk
      });
      break;
    default:
      printHelp();
  }

  console.log(`Stop convert ${inputType}`); // eslint-disable-line
  console.log(tilesetJson); // eslint-disable-line
}

// OPTIONS

function parseOptions(args) {
  const opts = {
    inputType: null,
    tileset: null,
    name: null,
    output: 'data'
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
        case '--input-type':
          opts.inputType = _getValue(index);
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
        case '--slpk':
          opts.slpk = true;
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
