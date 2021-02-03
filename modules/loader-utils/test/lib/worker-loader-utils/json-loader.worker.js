import {createLoaderWorker} from '@loaders.gl/loader-utils';

createLoaderWorker({
  name: 'TEST-JSON-LOADER',
  extensions: ['json'],
  parseTextSync: str => {
    console.log('TEST-JSON-LOADER:processing'); // eslint-disable-line
    return JSON.parse(str);
  }
});
