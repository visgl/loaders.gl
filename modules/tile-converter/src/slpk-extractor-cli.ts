import '@loaders.gl/polyfills';
import SLPKExtractor from './slpk-extractor/slpk-extractor';
import {getURLValue, validateOptionsWithEqual} from './lib/utils/cli-utils';

type SLPKExtractionOptions = {
  /** "tileset.json" file (3DTiles) / "http://..../SceneServer/layers/0" resource (I3S) */
  tileset?: string;
  /** Output folder. This folder will be created by converter if doesn't exist. It is relative to the converter path.
   * Default: "data" folder */
  output?: string;
};

/* During validation we check that particular options are defined so they can't be undefined */
export type ValidatedSLPKExtractionOptions = SLPKExtractionOptions & {
  /** slpk file */
  tileset: string;
  /** Output folder. This folder will be created by converter if doesn't exist. It is relative to the converter path.
   * Default: "data" folder */
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

  const options: SLPKExtractionOptions = parseOptions(validatedOptionsArr);

  const validatedOptions: ValidatedSLPKExtractionOptions = validateOptions(options);

  await convert(validatedOptions);
}

main().catch((error) => {
  console.log(error); // eslint-disable-line no-console
  process.exit(1); // eslint-disable-line no-process-exit
});

/**
 * Output for `npx slpk-extractor --help`
 */
function printHelp(): void {
  // eslint-disable-next-line no-console
  console.log('cli: converter slpk to I3S...');
  // eslint-disable-next-line no-console
  console.log('--output [Output folder, default: "data" folder]');
  // eslint-disable-next-line no-console
  console.log('--tileset [SLPK file]');
  process.exit(0); // eslint-disable-line no-process-exit
}

/**
 * Run extraction process
 * @param options validated slpk-extractor options
 */
async function convert(options: ValidatedSLPKExtractionOptions) {
  // eslint-disable-next-line no-console
  console.log('------------------------------------------------');
  // eslint-disable-next-line no-console
  console.log('Starting conversion of SLPK');
  // eslint-disable-next-line no-console
  console.log('------------------------------------------------');
  const slpkExtractor = new SLPKExtractor();
  slpkExtractor.extract({
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
function validateOptions(options: SLPKExtractionOptions): ValidatedSLPKExtractionOptions {
  const mandatoryOptionsWithExceptions: {
    [key: string]: () => void;
  } = {
    // eslint-disable-next-line no-console
    output: () => console.log('Missed: --output [Output path name]'),
    // eslint-disable-next-line no-console
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
    process.exit(1); // eslint-disable-line no-process-exit
  }
  return <ValidatedSLPKExtractionOptions>options;
}

/**
 * Parse option from the cli arguments array
 * @param args
 * @returns
 */
function parseOptions(args: string[]): SLPKExtractionOptions {
  const opts: SLPKExtractionOptions = {};

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
          // eslint-disable-next-line no-console
          console.warn(`Unknown option ${arg}`);
          process.exit(0); // eslint-disable-line
      }
    }
  });
  return opts;
}
