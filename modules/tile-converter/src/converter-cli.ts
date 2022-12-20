/* eslint-disable no-console */
import '@loaders.gl/polyfills';
import {join} from 'path';
import {I3SConverter, Tiles3DConverter} from '@loaders.gl/tile-converter';
import {DepsInstaller} from './deps-installer/deps-installer';

type TileConversionOptions = {
  /** "I3S" - for I3S to 3DTiles conversion, "3DTILES" for 3DTiles to I3S conversion */
  inputType?: string;
  /** "tileset.json" file (3DTiles) / "http://..../SceneServer/layers/0" resource (I3S) */
  tileset?: string;
  /** Tileset name. This option is used for naming in resulting json resouces and for resulting path/*.slpk file naming */
  name?: string;
  /** Output folder. This folder will be created by converter if doesn't exist. It is relative to the converter path.
   * Default: "data" folder */
  output: string;
  /** Keep created 3DNodeIndexDocument files on disk instead of memory. This option reduce memory usage but decelerates conversion speed */
  instantNodesWriting: boolean;
  /** 3DTiles->I3S only. location of 7z.exe archiver to create slpk on Windows OS, default: "C:\Program Files\7-Zip\7z.exe" */
  sevenZipExe: string;
  /** location of the Earth Gravity Model (*.pgm) file to convert heights from ellipsoidal to gravity-related format,
   * default: "./deps/egm2008-5.pgm". A model file can be loaded from GeographicLib
   * https://geographiclib.sourceforge.io/html/geoid.html */
  egm: string;
  /** 3DTile->I3S only. Token for Cesium ION tileset authentication. */
  token?: string;
  /** 3DTiles->I3S only. Enable draco compression for geometry. Default: true */
  draco: boolean;
  /** Run the script for installing dependencies. Run this options separate from others. Now "*.pgm" file installation is
   * implemented */
  installDependencies: boolean;
  /** 3DTile->I3S only. Enable KTX2 textures generation if only one of (JPG, PNG) texture is provided or generate JPG texture
   * if only KTX2 is provided */
  generateTextures: boolean;
  /** 3DTile->I3S only. Will generate obb and mbs bounding volumes from geometry */
  generateBoundingVolumes: boolean;
  /** Validate the dataset during conversion. Validation messages will be posted in the console output */
  validate: boolean;
  /** Maximal depth of the hierarchical tiles tree traversal, default: infinite */
  maxDepth?: number;
  /** 3DTiles->I3S only. Whether the converter generates *.slpk (Scene Layer Package) I3S output file */
  slpk: boolean;
};

/* During validation we check that particular options are defined so they can't be undefined */
type ValidatedTileConversionOptions = TileConversionOptions & {
  /** "I3S" - for I3S to 3DTiles conversion, "3DTILES" for 3DTiles to I3S conversion */
  inputType: string;
  /** "tileset.json" file (3DTiles) / "http://..../SceneServer/layers/0" resource (I3S) */
  tileset: string;
  /** Tileset name. This option is used for naming in resulting json resouces and for resulting path/*.slpk file naming */
  name: string;
};

const TILESET_TYPE = {
  I3S: 'I3S',
  _3DTILES: '3DTILES'
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

  if (options.installDependencies) {
    const depthInstaller = new DepsInstaller();
    depthInstaller.install('deps');
    return;
  }

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
  console.log('cli: converter 3dTiles to I3S or I3S to 3dTiles...');
  console.log(
    '--install-dependencies [Run the script for installing dependencies. Run this options separate from others. Now "*.pgm" file installation is implemented]'
  );
  console.log(
    '--max-depth [Maximal depth of hierarchical tiles tree traversal, default: infinite]'
  );
  console.log('--name [Tileset name]');
  console.log('--output [Output folder, default: "data" folder]');
  console.log(
    '--instant-nodes-writing [Keep created 3DNodeIndexDocument files on disk instead of memory. This option reduce memory usage but decelerates conversion speed]'
  );
  console.log('--slpk [Generate slpk (Scene Layer Packages) I3S output file]');
  console.log(
    '--tileset [tileset.json file (3DTiles) / http://..../SceneServer/layers/0 resource (I3S)]'
  );
  console.log('--input-type [tileset input type: I3S or 3DTILES]');
  console.log(
    '--7zExe [location of 7z.exe archiver to create slpk on Windows, default: "C:\\Program Files\\7-Zip\\7z.exe"]'
  );
  console.log(
    '--egm [location of Earth Gravity Model *.pgm file to convert heights from ellipsoidal to gravity-related format. A model file can be loaded from GeographicLib https://geographiclib.sourceforge.io/html/geoid.html], default: "./deps/egm2008-5.zip"'
  );
  console.log('--token [Token for Cesium ION tilesets authentication]');
  console.log('--no-draco [Disable draco compression for geometry]');
  console.log(
    '--generate-textures [Enable KTX2 textures generation if only one of (JPG, PNG) texture is provided or generate JPG texture if only KTX2 is provided]'
  );
  console.log(
    '--generate-bounding-volumes [Will generate obb and mbs bounding volumes from geometry]'
  );
  console.log('--validate [Enable validation]');
  process.exit(0); // eslint-disable-line
}

/**
 * Run conversion process
 * @param options validated tile-converter options
 */
async function convert(options: ValidatedTileConversionOptions) {
  console.log(`------------------------------------------------`); // eslint-disable-line
  console.log(`Starting conversion of ${options.inputType}`); // eslint-disable-line
  console.log(`------------------------------------------------`); // eslint-disable-line
  const inputType = options.inputType.toUpperCase();
  switch (inputType) {
    case TILESET_TYPE.I3S:
      const tiles3DConverter = new Tiles3DConverter();
      tiles3DConverter.convert({
        inputUrl: options.tileset,
        outputPath: options.output,
        tilesetName: options.name,
        maxDepth: options.maxDepth,
        egmFilePath: options.egm
      });
      break;
    case TILESET_TYPE._3DTILES:
      const converter = new I3SConverter();
      await converter.convert({
        inputUrl: options.tileset,
        outputPath: options.output,
        tilesetName: options.name,
        maxDepth: options.maxDepth,
        slpk: options.slpk,
        sevenZipExe: options.sevenZipExe,
        egmFilePath: options.egm,
        token: options.token,
        draco: options.draco,
        generateTextures: options.generateTextures,
        generateBoundingVolumes: options.generateBoundingVolumes,
        validate: options.validate,
        instantNodesWriting: options.instantNodesWriting
      });
      break;
    default:
      printHelp();
  }
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
    name: () => console.log('Missed: --name [Tileset name]'),
    output: () => console.log('Missed: --output [Output path name]'),
    sevenZipExe: () => console.log('Missed: --7zExe [7z archiver executable path]'),
    egm: () => console.log('Missed: --egm [*.pgm earth gravity model file path]'),
    tileset: () => console.log('Missed: --tileset [tileset.json file]'),
    inputType: () =>
      console.log('Missed/Incorrect: --input-type [tileset input type: I3S or 3DTILES]')
  };
  const exceptions: (() => void)[] = [];
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
  const opts: TileConversionOptions = {
    output: 'data',
    sevenZipExe: 'C:\\Program Files\\7-Zip\\7z.exe',
    egm: join(process.cwd(), 'deps', 'egm2008-5.pgm'),
    draco: true,
    installDependencies: false,
    generateTextures: false,
    generateBoundingVolumes: false,
    validate: false,
    slpk: false,
    instantNodesWriting: false
  };

  // eslint-disable-next-line complexity
  args.forEach((arg, index) => {
    if (arg.indexOf('--') === 0) {
      switch (arg) {
        case '--input-type':
          opts.inputType = getStringValue(index, args);
          break;
        case '--tileset':
          opts.tileset = getURLValue(index, args);
          break;
        case '--name':
          opts.name = getStringValue(index, args);
          break;
        case '--output':
          opts.output = getStringValue(index, args);
          break;
        case '--instant-nodes-writing':
          opts.instantNodesWriting = getBooleanValue(index, args);
          break;
        case '--max-depth':
          opts.maxDepth = getIntegerValue(index, args);
          break;
        case '--slpk':
          opts.slpk = getBooleanValue(index, args);
          break;
        case '--7zExe':
          opts.sevenZipExe = getStringValue(index, args);
          break;
        case '--egm':
          opts.egm = getStringValue(index, args);
          break;
        case '--token':
          opts.token = getStringValue(index, args);
          break;
        case '--no-draco':
          opts.draco = getBooleanValue(index, args);
          break;
        case '--validate':
          opts.validate = getBooleanValue(index, args);
          break;
        case '--install-dependencies':
          opts.installDependencies = getBooleanValue(index, args);
          break;
        case '--generate-textures':
          opts.generateTextures = getBooleanValue(index, args);
          break;
        case '--generate-bounding-volumes':
          opts.generateBoundingVolumes = getBooleanValue(index, args);
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

/**
 * Get integer option value from cli arguments
 * @param index - option's name index in the argument's array
 *                The value of the option should be next to name of the option.
 * @param args - cli arguments array
 * @returns - number value of the option
 */
function getIntegerValue(index: number, args: string[]): number {
  const stringValue: string = getStringValue(index, args);
  const result: number = Number.parseInt(stringValue);
  if (isFinite(result)) {
    return result;
  }
  return NaN;
}

function getBooleanValue(index: number, args: string[]): boolean {
  const stringValue: string = getStringValue(index, args).toLowerCase().trim();
  if (args[index] === '--no-draco' && !stringValue) {
    return false;
  }
  if (!stringValue || stringValue === 'true') {
    return true;
  }
  return false;
}
