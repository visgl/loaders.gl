import {createWorker} from '@loaders.gl/loader-utils';

createWorker({
  name: 'TEST-JSON-LOADER',
  extensions: ['json'],
  parseTextSync: str => {
    console.log('TEST-JSON-LOADER:processing'); // eslint-disable-line
    return JSON.parse(str);
  }
});
