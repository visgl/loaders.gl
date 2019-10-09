import {ConsoleLog} from './loader-utils/loggers';

// TODO - document these options
export const DEFAULT_LOADER_OPTIONS = {
  CDN: 'https://unpkg.com/@loaders.gl',
  worker: true, // By default, use worker if provided by loader
  log: new ConsoleLog(), // A probe.gl compatible (`log.log()()` syntax) that just logs to console
  dataType: 'arraybuffer' // TODO - explain why this option is needed for parsing
};
