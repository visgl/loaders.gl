/* eslint-disable no-console */
import '@loaders.gl/polyfills';
import SLPKConverter from './slpk-converter/slpk-converter';
// import {join} from 'path';
// import {I3SConverter, Tiles3DConverter} from '@loaders.gl/tile-converter';

type TileConversionOptions = {
  /** "tileset.json" file (3DTiles) / "http://..../SceneServer/layers/0" resource (I3S) */
  tileset?: string;
  output?: string;
};

/* During validation we check that particular options are defined so they can't be undefined */
type ValidatedTileConversionOptions = TileConversionOptions & {
  /** "I3S" - for I3S to 3DTiles conversion, "3DTILES" for 3DTiles to I3S conversion */
  tileset: string;
  output: string;
};

/**
 * CLI entry
 * @returns
 */
async function main() {
  const [, , ...args] = process.argv;

  if (args.length === 0) {
    printHelp();
  }

  const validatedOptionsArr = validateOptionsWithEqual(args);

  const options: TileConversionOptions = parseOptions(validatedOptionsArr);

  const validatedOptions: ValidatedTileConversionOptions = validateOptions(options);

  await convert(validatedOptions);
}

main().catch((error) => {
  console.log(error);
  process.exit(1); // eslint-disable-line
});

/**
 * Output for `npx tile-converter --help`
 */
function printHelp(): void {
  console.log('cli: converter slpk to I3S...');
  console.log('--output [Output folder, default: "data" folder]');
  console.log('--tileset [SLPK file]');
  process.exit(0); // eslint-disable-line
}

/**
 * Run conversion process
 * @param options validated tile-converter options
 */
async function convert(options: ValidatedTileConversionOptions) {
  console.log(`------------------------------------------------`); // eslint-disable-line
  console.log(`Starting conversion of SLPK`); // eslint-disable-line
  console.log(`------------------------------------------------`); // eslint-disable-line
  const tiles3DConverter = new SLPKConverter();
  tiles3DConverter.convert({
    inputUrl: options.tileset,
    outputPath: options.output
  });
}

// OPTIONS
/**
 * Validate input options of the CLI command
 * @param options - input options of the CLI command
 * @returns validated options
 */
function validateOptions(options: TileConversionOptions): ValidatedTileConversionOptions {
  const mandatoryOptionsWithExceptions: {
    [key: string]: () => void;
  } = {
    output: () => console.log('Missed: --output [Output path name]'),
    tileset: () => console.log('Missed: --tileset [SLPK file]')
  };
  const exceptions: (() => void)[] = [];
  for (const mandatoryOption in mandatoryOptionsWithExceptions) {
    const optionValue = options[mandatoryOption];
    if (!optionValue) {
      exceptions.push(mandatoryOptionsWithExceptions[mandatoryOption]);
    }
  }
  if (exceptions.length) {
    exceptions.forEach((exeption) => exeption());
    process.exit(1);
  }
  return <ValidatedTileConversionOptions>options;
}

function validateOptionsWithEqual(args: string[]): string[] {
  return args.reduce((acc: string[], curr) => {
    const equalSignIndex = curr.indexOf('=');
    const beforeEqual = curr.slice(0, equalSignIndex);
    const afterEqual = curr.slice(equalSignIndex + 1, curr.length);
    const condition = curr.includes('=') && curr.startsWith('--') && afterEqual;
    if (condition) {
      return acc.concat(beforeEqual, afterEqual);
    }
    return acc.concat(curr);
  }, []);
}

/**
 * Parse option from the cli arguments array
 * @param args
 * @returns
 */
function parseOptions(args: string[]): TileConversionOptions {
  const opts: TileConversionOptions = {};

  // eslint-disable-next-line complexity
  args.forEach((arg, index) => {
    if (arg.indexOf('--') === 0) {
      switch (arg) {
        case '--tileset':
          opts.tileset = getURLValue(index, args);
          break;
        case '--output':
          opts.output = getURLValue(index, args);
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

/**
 * Get string option value from cli arguments
 * @param index - option's name index in the argument's array.
 *                The value of the option should be next to name of the option.
 * @param args - cli arguments array
 * @returns - string value of the option
 */
function getStringValue(index: number, args: string[]): string {
  if (index + 1 >= args.length) {
    return '';
  }
  const value = args[index + 1];
  if (value.indexOf('--') === 0) {
    return '';
  }
  return value;
}

/**
 * Modyfy URL path to be compatible with fetch
 * @param index - option's name index in the argument's array.
 *                The value of the option should be next to name of the option.
 * @param args - cli arguments array
 * @returns - string value of the option
 */
function getURLValue(index: number, args: string[]): string {
  const value = getStringValue(index, args);
  console.log(`Input tileset value: ${value}`);
  console.log(`Modified tileset value: ${value.replace(/\\/g, '/')}`);
  return value.replace(/\\/g, '/');
}
